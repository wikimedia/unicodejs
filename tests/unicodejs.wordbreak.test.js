/*!
 * UnicodeJS Word Break module tests
 *
 * @copyright 2013-2018 UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 'unicodeJS.wordbreak' );

QUnit.test( 'Unicode test suite', function ( assert ) {
	unicodeJS.testdata.wordbreak.reduce( unicodeJS.test.parseTestReduce, [] )
		.forEach( function ( test ) {
			var i,
				textString = new unicodeJS.TextString( test.string ),
				result = [];

			for ( i = 0; i <= test.string.length; i++ ) {
				result.push( unicodeJS.wordbreak.isBreak( textString, i ) );
			}
			assert.deepEqual( result, test.expected, test.msg );
		} );
} );

QUnit.test( 'nextBreakOffset/prevBreakOffset', function ( assert ) {
	var i, offset = 0,
		text = 'The quick brown fox',
		textString = new unicodeJS.TextString( text ),
		breaks = [ 0, 0, 3, 4, 9, 10, 15, 16, 19, 19 ];

	for ( i = 2; i < breaks.length; i++ ) {
		offset = unicodeJS.wordbreak.nextBreakOffset( textString, offset );
		assert.strictEqual( offset, breaks[ i ], 'Next break is at position ' + breaks[ i ] );
	}
	for ( i = breaks.length - 3; i >= 0; i-- ) {
		offset = unicodeJS.wordbreak.prevBreakOffset( textString, offset );
		assert.strictEqual( offset, breaks[ i ], 'Previous break is at position ' + breaks[ i ] );
	}
} );

QUnit.test( 'nextBreakOffset/prevBreakOffset (ignore whitespace)', function ( assert ) {
	var i, offset = 0,
		text =
			// 0
			'   The qui' +
			// 10
			'ck  brown ' +
			// 20
			'..fox jump' +
			// 30
			's... 3.141' +
			// 40
			'59 すどくスドク ' +
			// 50
			'עברית  ',
		textString = new unicodeJS.TextString( text ),
		nextBreaks = [ 6, 12, 19, 25, 31, 42, 49, 55, 57 ],
		prevBreaks = [ 50, 46, 35, 26, 22, 14, 7, 3, 0 ];

	for ( i = 0; i < nextBreaks.length; i++ ) {
		offset = unicodeJS.wordbreak.nextBreakOffset( textString, offset, true );
		assert.strictEqual( offset, nextBreaks[ i ], 'Next break is at position ' + nextBreaks[ i ] );
	}
	for ( i = 0; i < prevBreaks.length; i++ ) {
		offset = unicodeJS.wordbreak.prevBreakOffset( textString, offset, true );
		assert.strictEqual( offset, prevBreaks[ i ], 'Previous break is at position ' + prevBreaks[ i ] );
	}
} );

QUnit.test( 'TextString', function ( assert ) {
	var plainString = 'abc𨋢def',
		textString = new unicodeJS.TextString( plainString );

	assert.strictEqual( textString.toString(), plainString, 'toString' );
} );
