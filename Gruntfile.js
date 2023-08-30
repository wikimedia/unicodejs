'use strict';

module.exports = function ( grunt ) {
	const modules = require( './build/modules.json' ),
		moduleUtils = require( './build/moduleUtils.js' ),
		srcFiles = moduleUtils.makeBuildList( modules, [ 'unicodejs' ] ).scripts,
		testFiles = moduleUtils.makeBuildList( modules, [ 'unicodejs.tests' ] ).scripts;

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-contrib-copy' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-exec' );
	grunt.loadNpmTasks( 'grunt-karma' );
	grunt.loadTasks( 'build/tasks' );

	grunt.initConfig( {
		clean: {
			dist: [ 'dist', 'coverage' ]
		},
		copy: {
			dist: {
				src: [
					'AUTHORS.txt',
					'LICENSE.txt',
					'History.md',
					'README.md'
				],
				dest: 'dist/'
			}
		},
		concat: {
			all: {
				options: {
					banner: grunt.file.read( 'build/banner.txt' ),
					footer: grunt.file.read( 'build/footer.txt' )
				},
				dest: 'dist/unicodejs.js',
				src: srcFiles
			}
		},
		exec: {
			cmd: 'node tools/unicodejs-properties.js && node tools/unicodejs-tests.js'
		},
		eslint: {
			options: {
				cache: true,
				fix: grunt.option( 'fix' )
			},
			all: '.'
		},
		karma: {
			options: {
				files: testFiles,
				frameworks: [ 'qunit' ],
				reporters: [ 'dots', 'coverage' ],
				singleRun: true,
				autoWatch: false,
				preprocessors: {
					'src/*.js': [ 'coverage' ]
				},
				customLaunchers: {
					ChromeCustom: {
						base: 'ChromeHeadless',
						// Chrome requires --no-sandbox in Docker/CI.
						flags: ( process.env.CHROMIUM_FLAGS || '' ).split( ' ' )
					}
				},
				coverageReporter: {
					dir: 'coverage/',
					subdir: '.',
					reporters: [
						{ type: 'clover' },
						{ type: 'html' },
						{ type: 'text-summary' }
					],
					check: { global: {
						functions: 100,
						statements: 100,
						branches: 100,
						lines: 100
					} }
				}
			},
			firefox: {
				browsers: [ 'FirefoxHeadless' ]
			},
			chrome: {
				browsers: [ 'ChromeCustom' ]
			}
		}
	} );

	grunt.registerTask( 'lint', [ 'eslint' ] );
	grunt.registerTask( 'update', [ 'exec' ] );
	// Workaround for T280935, and T240955.
	// Firefox 68esr is incompatible with Docker.
	// TODO: Try this again when Firefox 84esr reaches our CI images.
	grunt.registerTask( 'unit', ( process.env.ZUUL_PIPELINE ?
		[ 'karma:chrome' ] :
		[ 'karma:chrome', 'karma:firefox' ]
	) );
	grunt.registerTask( '_build', [ 'clean', 'concat', 'copy' ] );
	grunt.registerTask( 'build', [ 'set-meta', '_build' ] );
	grunt.registerTask( 'test', [ 'set-meta', 'set-dev', '_build', 'lint', 'unit' ] );
};
