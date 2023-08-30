'use strict';

// Generates unicodejs.*.testdata.js from Unicode test data

const VERSION = '15.0.0',
	http = require( 'http' ),
	fs = require( 'fs-extra' ),
	dir = __dirname + '/../tests/generated',
	data = [
		{
			url: 'http://www.unicode.org/Public/%V/ucd/auxiliary/WordBreakTest.txt',
			jsname: 'wordbreak'
		},
		{
			url: 'http://www.unicode.org/Public/%V/ucd/auxiliary/GraphemeBreakTest.txt',
			jsname: 'graphemebreak'
		}
	];

function buildTests( body, jsname ) {
	const output = [],
		lines = body.split( /\n/ );

	lines.forEach( ( line ) => {
		const parts = line.split( '#' );
		if ( !parts[ 0 ] ) {
			return;
		}
		output.push( line );
	} );

	// Write js file
	const js = '// This file is GENERATED by tools/unicodejs-tests.js\n' +
		'// DO NOT EDIT\n' +
		'unicodeJS.testdata.' + jsname + ' = ' + JSON.stringify( output, null, '\t' ).replace( /"/g, '\'' ) + ';\n';

	const filename = dir + '/unicodejs.' + jsname + '.testdata.js';
	// eslint-disable-next-line security/detect-non-literal-fs-filename
	fs.writeFile( filename, js, ( err ) => {
		if ( err ) {
			throw err;
		}
		console.log( 'wrote ' + filename );
	} );
}

fs.emptyDir( dir, ( err ) => {
	if ( err ) {
		throw err;
	}
	console.log( 'deleted old files' );
	data.forEach( ( options ) => {
		const url = options.url.replace( '%V', VERSION );
		console.log( 'fetching ' + url );
		const request = http.get( url, ( res ) => {
			let body = '';

			res.setEncoding( 'utf8' );

			res.on( 'data', ( chunk ) => {
				body += chunk;
			} );

			res.on( 'end', () => {
				buildTests( body, options.jsname );
			} );
		} );
		request.end();
	} );
} );
