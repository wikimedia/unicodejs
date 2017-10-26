/* eslint-env node */
module.exports = function ( grunt ) {
	var modules = grunt.file.readJSON( 'build/modules.json' ),
		moduleUtils = require( './build/moduleUtils' ),
		srcFiles = moduleUtils.makeBuildList( modules, [ 'unicodejs' ] ).scripts,
		testFiles = moduleUtils.makeBuildList( modules, [ 'unicodejs.tests' ] ).scripts;

	grunt.loadNpmTasks( 'grunt-contrib-clean' );
	grunt.loadNpmTasks( 'grunt-contrib-concat' );
	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-karma' );
	grunt.loadTasks( 'build/tasks' );

	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),
		clean: {
			dist: [ 'dist', 'coverage' ]
		},
		concat: {
			all: {
				options: {
					banner: grunt.file.read( 'build/banner.txt' )
				},
				dest: 'dist/unicodejs.js',
				src: srcFiles
			}
		},
		eslint: {
			all: [
				'*.js',
				'{build,src,tests}/**/*.js'
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
				coverageReporter: {
					dir: 'coverage/',
					subdir: '.',
					reporters: [
						{ type: 'json-summary', file: 'coverage-summary.json' },
						{ type: 'html' },
						{ type: 'text-summary' }
					],
					check: { global: {
						functions: 100,
						statements: 95,
						branches: 90,
						lines: 95
					} }
				}
			},
			main: {
				browsers: [ 'Chrome' ]
			},
			firefox: {
				browsers: [ 'Firefox' ]
			}
		}
	} );

	grunt.registerTask( 'build', [ 'clean', 'concat' ] );
	grunt.registerTask( 'lint', [ 'eslint' ] );
	grunt.registerTask( 'unit', [ 'karma:main' ] );
	grunt.registerTask( 'test', [ 'git-build', 'build', 'lint', 'unit' ] );
	grunt.registerTask( 'default', 'test' );
};
