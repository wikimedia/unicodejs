#!/usr/bin/env node

// Generates unicodejs.*(properties|categories).js from Unicode data

'use strict';

const VERSION = '13.0.0',
	hasOwn = Object.hasOwnProperty,
	http = require( 'http' ),
	fs = require( 'fs-extra' ),
	dir = __dirname + '/../src/generated',
	data = [
		{
			url: 'http://unicode.org/Public/%V/ucd/DerivedCoreProperties.txt',
			jsname: 'derivedcoreproperties',
			propPatterns: [ /^(Alphabetic)$/ ]
		},
		{
			url: 'http://www.unicode.org/Public/%V/ucd/extracted/DerivedGeneralCategory.txt',
			jsname: 'derivedgeneralcategories',
			propPatterns: [ /^(Pc)$/, /^(M).*$/ ]
		},
		{
			url: 'http://www.unicode.org/Public/%V/ucd/auxiliary/GraphemeBreakProperty.txt',
			jsname: 'graphemebreakproperties',
			full: true,
			propPatterns: [ /^(.*)$/ ],
			excludeSurrogates: true
		},
		{
			url: 'http://www.unicode.org/Public/%V/ucd/auxiliary/WordBreakProperty.txt',
			jsname: 'wordbreakproperties',
			full: true,
			propPatterns: [ /^(.*)$/ ]
		},
		{
			url: 'http://www.unicode.org/Public/%V/ucd/extracted/DerivedBidiClass.txt',
			jsname: 'derivedbidiclasses',
			propPatterns: [ /^(L|R|AL)$/ ]
		},
		{
			url: 'http://www.unicode.org/Public/%V/ucd/emoji/emoji-data.txt',
			jsname: 'emojiproperties',
			propPatterns: [ /^(Extended_Pictographic)$/ ]
		}
	];

function extractProperties( body, jsname, full, propPatterns, excludeSurrogates ) {
	const lines = body.split( /\n/ ),
		// range[ property ] -> character range list e.g. [ 0x0040, [ 0x0060-0x0070 ], 0x00A3, ... ]
		ranges = {},
		// A list of property name strings like "Extend", "Format" etc
		properties = [],
		fragments = [],
		blankTest = /^\s*(#|$)/,
		definitionTest = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*(\w+)\s*#/;

	lines.forEach( ( line ) => {
		line = line.trim();
		// Ignore comment or blank lines
		if ( line.match( blankTest ) ) {
			return;
		}
		// Find things like one of the following:
		//   XXXX       ; propertyname
		//   XXXX..YYYY ; propertyname
		const lineMatches = line.match( definitionTest );
		if ( !lineMatches ) {
			throw new Error( 'Bad line: ' + line );
		}

		const start = parseInt( lineMatches[ 1 ], 16 );
		const end = parseInt( lineMatches[ 2 ] || lineMatches[ 1 ], 16 );
		const propText = lineMatches[ 3 ];

		propPatterns.forEach( function ( propPattern ) {
			const propMatches = propText.match( propPattern );
			if ( propMatches ) {
				const propName = propMatches[ 1 ];
				if ( !hasOwn.call( ranges, propName ) ) {
					properties.push( propName );
					ranges[ propName ] = [];
				}
				ranges[ propName ].push( [ start, end ] );
			}
		} );
	} );

	// Translate ranges into js fragments
	properties.forEach( ( prop ) => {
		const rangeStrings = [],
			propRanges = ranges[ prop ];

		// Merge consecutive ranges
		propRanges.sort( ( a, b ) => {
			return a[ 0 ] - b[ 0 ];
		} );

		for ( let i = 1; i < propRanges.length; i++ ) {
			if ( propRanges[ i - 1 ][ 1 ] + 1 === propRanges[ i ][ 0 ] ) {
				propRanges[ i - 1 ] = [
					propRanges[ i - 1 ][ 0 ],
					propRanges[ i ][ 1 ]
				];
				propRanges.splice( i, 1 );
				i--;
			}
		}

		function toHex( num ) {
			const hex = num.toString( 16 ).toUpperCase();
			return '0x' + ( '0000' + hex ).slice( Math.min( -4, -hex.length ) );
		}

		propRanges.forEach( ( propRange ) => {
			const start = propRange[ 0 ],
				end = propRange[ 1 ];

			if ( excludeSurrogates && start === 0xD800 && end === 0xDFFF ) {
				return;
			} else if ( end === start ) {
				rangeStrings.push( toHex( start ) );
			} else if ( end === start + 1 ) {
				rangeStrings.push( toHex( start ), toHex( end ) );
			} else {
				rangeStrings.push( '[ ' + toHex( start ) + ', ' + toHex( end ) + ' ]' );
			}
		} );
		fragments.push( prop.replace( /_/g, '' ) + ': [ ' + rangeStrings.join( ', ' ) + ' ]' );
	} );

	// Write js file
	let js = '// This file is GENERATED by tools/unicodejs-properties.js\n' +
		'// DO NOT EDIT\n' +
		'unicodeJS.' + jsname + ' = {\n\t';
	if ( !full ) {
		js += '// partial extraction only\n\t';
	}
	js += fragments.join( ',\n\t' ) +
		'\n};\n';

	const filename = dir + '/unicodejs.' + jsname + '.js';
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
	data.forEach( function ( options ) {
		const url = options.url.replace( '%V', VERSION );
		console.log( 'fetching ' + url );
		const request = http.get( url, ( res ) => {
			let body = '';

			res.setEncoding( 'utf8' );

			res.on( 'data', function ( chunk ) {
				body += chunk;
			} );

			res.on( 'end', function () {
				extractProperties(
					body,
					options.jsname,
					!!options.full,
					options.propPatterns,
					!!options.excludeSurrogates
				);
			} );
		} );
		request.end();
	} );
} );
