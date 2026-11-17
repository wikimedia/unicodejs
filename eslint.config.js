'use strict';

const { defineConfig, globalIgnores } = require( 'eslint/config' );
const wikimedia = require( 'eslint-config-wikimedia/flat' );
const html = require( 'eslint-plugin-html' );

module.exports = defineConfig( [
	globalIgnores( [
		'coverage/',
		'dist/',
		'docs/'
	] ),

	{
		ignores: [
			'src/**',
			'tests/**',
			'tools/**/*.html'
		],
		extends: [ wikimedia( 'server' ) ]
	},
	{
		files: [
			'src/**/*.js'
		],
		extends: [ wikimedia( 'common', 'language/es2017' ) ],
		languageOptions: {
			globals: {
				unicodeJS: 'writable'
			}
		},
		rules: {
			'max-len': 'off'
		}
	},
	{
		files: [
			'tests/**/*.js',
			'tests/**/*.html'
		],
		extends: [ wikimedia( 'common', 'language/es2019', 'qunit' ) ],
		languageOptions: {
			globals: {
				unicodeJS: 'readonly'
			}
		}
	},
	{
		files: [
			'tools/**/*.html'
		],
		extends: [ wikimedia( 'client' ) ],
		languageOptions: {
			globals: {
				unicodeJS: 'readonly'
			}
		},
		rules: {
			'no-implicit-globals': 'off'
		}
	},
	{
		files: [ '**/*.html' ],
		plugins: { html },
		languageOptions: {
			sourceType: 'script'
		},
		settings: {
			'html/indent': '+tab',
			'html/report-bad-indent': 'error'
		}
	}
] );
