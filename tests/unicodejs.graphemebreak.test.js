/*!
 * UnicodeJS Grapheme Break module tests
 *
 * @copyright 2013– UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 'unicodeJS.graphemebreak' );

QUnit.test( 'Unicode test suite', ( assert ) => {
	unicodeJS.testdata.graphemebreak.reduce( unicodeJS.test.parseTestReduce, [] )
		.forEach( ( test ) => {
			const expected = test.expected;
			const clusters = unicodeJS.graphemebreak.splitClusters( test.string );
			const result = clusters.flatMap( ( cluster ) => [
				// Push cluster.length-1 false's (no breaks) for each cluster
				...Array( cluster.length - 1 ).fill( false ),
				// Expect break after cluster
				true
			] );
			result.unshift( true );

			assert.deepEqual(
				result,
				expected,
				test.msg
			);
		} );
} );

QUnit.test( 'splitClusters', ( assert ) => {
	const expected = [
		'a',
		' ',
		' ',
		'b',
		'カ',
		'タ',
		'カ',
		'ナ',
		'c\u0300\u0327', // c with two combining chars
		'\ud800\udf08', // U+10308 OLD ITALIC LETTER THE
		'\ud800\udf08\u0302', // U+10308 + combining circumflex
		'\r\n',
		'\n',
		'\u1104\u1173', // jamo L+V
		'\u1105\u1161\u11a8', // jamo L+V+T
		'\ud83c\udded\ud83c\uddf0' // 2*regional indicator characters
	];
	assert.deepEqual(
		unicodeJS.graphemebreak.splitClusters( expected.join( '' ) ),
		expected,
		'Split clusters'
	);
} );
