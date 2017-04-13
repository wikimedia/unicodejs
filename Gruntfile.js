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
				reporters: [ 'dots' ],
				singleRun: true,
				autoWatch: false
			},
			phantomjs: {
				browsers: [ 'PhantomJS' ],
				preprocessors: {
					'src/*.js': [ 'coverage' ]
				},
				reporters: [ 'dots', 'coverage' ],
				coverageReporter: { reporters: [
					{ type: 'text-summary' },
					{ type: 'html', dir: 'coverage/' }
				] }
			},
			local: {
				browsers: [ 'Firefox', 'Chrome' ]
			}
		}
	} );

	grunt.registerTask( 'build', [ 'clean', 'concat' ] );
	grunt.registerTask( 'lint', [ 'eslint' ] );
	grunt.registerTask( 'unit', [ 'karma:phantomjs' ] );
	grunt.registerTask( 'test', [ 'git-build', 'build', 'lint', 'unit' ] );
	grunt.registerTask( 'default', 'test' );
};
