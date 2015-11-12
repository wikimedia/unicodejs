#!/usr/bin/env node

// Generates unicodejs.*(properties|categories).js from Unicode data

/* jshint node: true */

var http = require( 'http' ),
	fs = require( 'fs' );

function extractProperties( body, jsname, full, propPatterns, excludeSurrogates ) {
	var js, filename,
		lines = body.split( /\n/ ),
		// range[ property ] -> character range list e.g. [ 0x0040, [ 0x0060-0x0070 ], 0x00A3, ... ]
		ranges = {},
		// A list of property name strings like "Extend", "Format" etc
		properties = [],
		fragments = [],
		blankTest = /^\s*(#|$)/,
		definitionTest = /^([0-9A-F]{4,6})(?:\.\.([0-9A-F]{4,6}))?\s*;\s*(\w+)\s*#/;

	lines.forEach( function ( line ) {
		var matches, jsname, start, end, propText;

		line = line.trim();
		// Ignore comment or blank lines
		if ( line.match( blankTest ) ) {
			return;
		}
		// Find things like one of the following:
		//   XXXX       ; propertyname
		//   XXXX..YYYY ; propertyname
		matches = line.match( definitionTest );
		if ( !matches ) {
			throw new Error( 'Bad line: ' + line );
		}

		start = parseInt( matches[ 1 ], 16 );
		end = parseInt( matches[ 2 ] || matches[ 1 ], 16 );
		propText = matches[ 3 ];
		if ( jsname === 'graphemebreakproperties' && start === 0xD800 && end === 0xDFFF ) {
			// raw surrogates are not treated
			return;
		}

		propPatterns.forEach( function ( propPattern ) {
			var propName,
				matches = propText.match( propPattern );
			if ( matches ) {
				propName = matches[ 1 ];
				if ( !ranges.hasOwnProperty( propName ) ) {
					properties.push( propName );
					ranges[ propName ] = [];
				}
				ranges[ propName ].push( [ start, end ] );
			}
		} );

	} );

	// Translate ranges into js fragments
	properties.forEach( function ( prop ) {
		var i,
			rangeStrings = [],
			propRanges = ranges[ prop ];

		// Merge consecutive ranges
		propRanges.sort( function ( a, b ) {
			return a[ 0 ] - b[ 0 ];
		} );

		for ( i = 1; i < propRanges.length; i++ ) {
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
			var hex = num.toString( 16 ).toUpperCase();
			return '0x' + ( '0000' + hex ).slice( Math.min( -4, -hex.length ) );
		}

		propRanges.forEach( function ( propRange ) {
			var start = propRange[ 0 ],
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
		fragments.push( prop.replace( '_', '' ) + ': [ ' + rangeStrings.join( ', ' ) + ' ]' );
	} );

	// Write js file
	js = '// This file is GENERATED by tools/unicodejs-properties.js\n' +
		'// DO NOT EDIT\n' +
		'unicodeJS.' + jsname + ' = {\n\t';
	if ( !full ) {
		js += '// partial extraction only\n\t';
	}
	js += fragments.join( ',\n\t' ) +
		'\n};\n';

	filename = __dirname + '/../src/unicodejs.' + jsname + '.js';
	fs.writeFile( filename, js );
	console.log( 'wrote ' + filename );
}

[
	{
		url: 'http://unicode.org/Public/UNIDATA/DerivedCoreProperties.txt',
		jsname: 'derivedcoreproperties',
		propPatterns: [ /^(Alphabetic)$/ ]
	},
	{
		url: 'http://www.unicode.org/Public/UNIDATA/extracted/DerivedGeneralCategory.txt',
		jsname: 'derivedgeneralcategories',
		propPatterns: [ /^(Pc)$/, /^(M).*$/ ]
	},
	{
		url: 'http://www.unicode.org/Public/UNIDATA/auxiliary/GraphemeBreakProperty.txt',
		jsname: 'graphemebreakproperties',
		full: true,
		propPatterns: [ /^(.*)$/ ],
		excludeSurrogates: true
	},
	{
		url: 'http://www.unicode.org/Public/UNIDATA/auxiliary/WordBreakProperty.txt',
		jsname: 'wordbreakproperties',
		full: true,
		propPatterns: [ /^(.*)$/ ]
	},
	{
		url: 'http://www.unicode.org/Public/UCD/latest/ucd/extracted/DerivedBidiClass.txt',
		jsname: 'derivedbidiclasses',
		propPatterns: [ /^(L|R|AL)$/ ]
	}
].forEach( function ( options ) {
	var request = http.request( options.url, function ( res ) {
		var body = '';

		res.on( 'data', function ( data ) {
			body += data;
		} );

		res.on( 'end', function () {
			extractProperties( body, options.jsname, !!options.full, options.propPatterns, !!options.excludeSurrogates );
		} );
	} );
	request.end();
} );
