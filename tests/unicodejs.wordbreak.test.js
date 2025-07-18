/*!
 * UnicodeJS Word Break module tests
 *
 * @copyright 2013– UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 'unicodeJS.wordbreak' );

QUnit.test( 'Unicode test suite', ( assert ) => {
	unicodeJS.testdata.wordbreak.reduce( unicodeJS.test.parseTestReduce, [] )
		.forEach( ( test ) => {
			const textString = new unicodeJS.TextString( test.string ),
				result = [];

			for ( let i = 0; i <= test.string.length; i++ ) {
				result.push( unicodeJS.wordbreak.isBreak( textString, i ) );
			}
			assert.deepEqual( result, test.expected, test.msg );
		} );
} );

QUnit.test( 'nextBreakOffset/prevBreakOffset', ( assert ) => {
	const text = 'The quick brown fox',
		textString = new unicodeJS.TextString( text ),
		breaks = [ 0, 0, 3, 4, 9, 10, 15, 16, 19, 19 ];

	let offset = 0;
	for ( let i = 2; i < breaks.length; i++ ) {
		offset = unicodeJS.wordbreak.nextBreakOffset( textString, offset );
		assert.strictEqual( offset, breaks[ i ], 'Next break is at position ' + breaks[ i ] );
	}
	for ( let i = breaks.length - 3; i >= 0; i-- ) {
		offset = unicodeJS.wordbreak.prevBreakOffset( textString, offset );
		assert.strictEqual( offset, breaks[ i ], 'Previous break is at position ' + breaks[ i ] );
	}
} );

QUnit.test( 'nextBreakOffset/prevBreakOffset (ignore whitespace)', ( assert ) => {
	const text =
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

	let offset = 0;
	nextBreaks.forEach( ( expectedOffset ) => {
		offset = unicodeJS.wordbreak.nextBreakOffset( textString, offset, true );
		assert.strictEqual( offset, expectedOffset, 'Next break is at position ' + expectedOffset );
	} );
	prevBreaks.forEach( ( expectedOffset ) => {
		offset = unicodeJS.wordbreak.prevBreakOffset( textString, offset, true );
		assert.strictEqual( offset, expectedOffset, 'Previous break is at position ' + expectedOffset );
	} );
} );

QUnit.test( 'TextString', ( assert ) => {
	const plainString = 'abc𨋢def',
		textString = new unicodeJS.TextString( plainString );

	assert.strictEqual( textString.toString(), plainString, 'toString' );
} );
