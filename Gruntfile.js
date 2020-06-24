/* eslint-env node, es6 */
module.exports = function ( grunt ) {
	var modules = grunt.file.readJSON( 'build/modules.json' ),
		moduleUtils = require( './build/moduleUtils' ),
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
		pkg: grunt.file.readJSON( 'package.json' ),
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
			all: [
				'**/*.{js,json}',
				'!{coverage,dist,docs,node_modules}/**'
			]
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
			main: {
				browsers: [ 'ChromeCustom', 'FirefoxHeadless' ]
			}
		}
	} );

	grunt.registerTask( 'build', [ 'clean', 'concat', 'copy' ] );
	grunt.registerTask( 'lint', [ 'eslint' ] );
	grunt.registerTask( 'update', [ 'exec' ] );
	grunt.registerTask( 'unit', [ 'karma' ] );
	grunt.registerTask( 'test', [ 'git-build', 'build', 'lint', 'unit' ] );
};
