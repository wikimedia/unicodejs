/*!
 * UnicodeJS character class module tests
 *
 * @copyright 2015– UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

QUnit.module( 'unicodeJS.characterclass' );

QUnit.test( 'patterns', ( assert ) => {
	// eslint-disable-next-line security/detect-non-literal-regexp
	const wordGlobalRegex = new RegExp( unicodeJS.characterclass.patterns.word, 'g' );

	const wordChars = [
		// Basic Latin letter
		'a',
		// Basic Latin number
		'1',
		// Underscore (Punctuation, connector)
		'_',
		// Latin-1 Supplement letter
		'é',
		// Latin Extended-A letter
		'ŵ',
		// Mark (combining accent)
		'x', '\u0301',
		// Han character
		'中',
		// Full-width punctuation connector
		'︴',
		// SMP Han character U+282E2
		'𨋢',
		// Combining mark and ZWNJ
		'क', '\u094d', '\u200C', 'ष',
		// SMP math letter U+1D538
		'𝔸'
	];

	const nonWordChars = [
		// Basic Latin punctuation
		'$', '-', '.', '!', ' ', '"', '\'', '(', ')', '[', ']', '{', '}',
		// Other punctuation
		'“', '”', '‘', '’', '「', '」',
		// Space
		' ', '\r', '\n', '\t', '\u3000',
		// Non-Basic-Latin digit U+0668 and U+1D7E0
		'٨',
		// SMP emoticon U+1F607 and digit U+1D7E0
		'😇', '𝟠'
	];

	assert.deepEqual( wordChars.join( '' ).match( wordGlobalRegex ), wordChars );
	assert.strictEqual( nonWordChars.join( '' ).match( wordGlobalRegex ), null );
} );
