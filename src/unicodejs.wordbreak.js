/*!
 * UnicodeJS Word Break module
 *
 * Implementation of Unicode 8.0.0 Default Word Boundary Specification
 * http://www.unicode.org/reports/tr29/#Default_Word_Boundaries
 *
 * @copyright 2013-2018 UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/* eslint-disable no-fallthrough */

( function () {
	var property,
		properties = unicodeJS.wordbreakproperties,
		/**
		 * @class unicodeJS.wordbreak
		 * @singleton
		 */
		wordbreak = unicodeJS.wordbreak = {},
		patterns = {};

	// build regexes
	for ( property in properties ) {
		patterns[ property ] = new RegExp(
			unicodeJS.charRangeArrayRegexp( properties[ property ] )
		);
	}

	/**
	 * Return the wordbreak property value for the codepoint
	 *
	 * See http://www.unicode.org/reports/tr29/#Word_Boundaries
	 *
	 * @private
	 * @param {string} codepoint The codepoint
	 * @return {string|null} The unicode wordbreak property value (key of unicodeJS.wordbreakproperties)
	 */
	function getProperty( codepoint ) {
		// codepoint is always converted to a string by RegExp#test
		// e.g. null -> 'null' and would match /[a-z]/
		// so return null for any non-string value
		if ( typeof codepoint !== 'string' ) {
			return null;
		}
		for ( property in patterns ) {
			if ( patterns[ property ].test( codepoint ) ) {
				return property;
			}
		}
		return null;
	}

	/**
	 * Find the next word break offset.
	 *
	 * @param {unicodeJS.TextString} string TextString
	 * @param {number} pos Character position
	 * @param {boolean} [onlyAlphaNumeric=false] When set, ignores a break if the previous character is not alphaNumeric
	 * @return {number} Returns the next offset which is a word break
	 */
	wordbreak.nextBreakOffset = function ( string, pos, onlyAlphaNumeric ) {
		return wordbreak.moveBreakOffset( 1, string, pos, onlyAlphaNumeric );
	};

	/**
	 * Find the previous word break offset.
	 *
	 * @param {unicodeJS.TextString} string TextString
	 * @param {number} pos Character position
	 * @param {boolean} [onlyAlphaNumeric=false] When set, ignores a break if the previous character is not alphaNumeric
	 * @return {number} Returns the previous offset which is a word break
	 */
	wordbreak.prevBreakOffset = function ( string, pos, onlyAlphaNumeric ) {
		return wordbreak.moveBreakOffset( -1, string, pos, onlyAlphaNumeric );
	};

	/**
	 * Find the next word break offset in a specified direction.
	 *
	 * @param {number} direction Direction to search in, should be plus or minus one
	 * @param {unicodeJS.TextString} string TextString
	 * @param {number} pos Character position
	 * @param {boolean} [onlyAlphaNumeric=false] When set, ignores a break if the previous character is not alphaNumeric
	 * @return {number} Returns the previous offset which is word break
	 */
	wordbreak.moveBreakOffset = function ( direction, string, pos, onlyAlphaNumeric ) {
		var lastProperty, i = pos,
			// when moving backwards, use the character to the left of the cursor
			readCharOffset = direction > 0 ? 0 : -1;
		// Search backwards for the previous break point
		while ( string.read( i + readCharOffset ) !== null ) {
			i += direction;
			if ( unicodeJS.wordbreak.isBreak( string, i ) ) {
				// Check previous character was alpha-numeric if required
				if ( onlyAlphaNumeric ) {
					lastProperty = getProperty(
						string.read( i - direction + readCharOffset )
					);
					if ( lastProperty !== 'ALetter' &&
						lastProperty !== 'Numeric' &&
						lastProperty !== 'Katakana' &&
						lastProperty !== 'HebrewLetter' ) {
						continue;
					}
				}
				break;
			}
		}
		return i;
	};

	/**
	 * Evaluates whether a position within some text is a word boundary.
	 *
	 * The text object elements may be codepoints or code units (deprecated)
	 *
	 * @param {unicodeJS.TextString} string TextString
	 * @param {number} pos Character position
	 * @return {boolean} Is the position a word boundary
	 */
	wordbreak.isBreak = function ( string, pos ) {
		var nextRgt, nextLft,
			lft = [],
			rgt = [],
			l = 0,
			r = 0;

		// Break at the start and end of text.
		// WB1: sot ÷
		// WB2: ÷ eot
		if ( string.read( pos - 1 ) === null || string.read( pos ) === null ) {
			return true;
		}

		// Compatibility with TextString objects that split codepoints
		// Do not break inside surrogate pair
		if (
			string.read( pos - 1 ).match( /^[\uD800-\uDBFF]$/ ) &&
			string.read( pos ).match( /^[\uDC00-\uDFFF]$/ )
		) {
			return false;
		}

		// get some context
		rgt.push( getProperty( string.read( pos + r ) ) );
		lft.push( getProperty( string.read( pos - l - 1 ) ) );

		switch ( true ) {
			// Do not break within CRLF.
			// WB3: CR × LF
			case lft[ 0 ] === 'CR' && rgt[ 0 ] === 'LF':
				return false;

			// Otherwise break before and after Newlines (including CR and LF)
			// WB3a: (Newline | CR | LF) ÷
			case lft[ 0 ] === 'Newline' || lft[ 0 ] === 'CR' || lft[ 0 ] === 'LF':
			// WB3b: ÷ (Newline | CR | LF)
			case rgt[ 0 ] === 'Newline' || rgt[ 0 ] === 'CR' || rgt[ 0 ] === 'LF':
				return true;
		}

		// Ignore Format and Extend characters, except when they appear at the beginning of a region of text.
		// WB4: X (Extend | Format)* → X
		if ( rgt[ 0 ] === 'Extend' || rgt[ 0 ] === 'Format' ) {
			// The Extend|Format character is to the right, so it is attached
			// to a character to the left, don't split here
			return false;
		}
		// We've reached the end of an Extend|Format sequence, collapse it
		while ( lft[ 0 ] === 'Extend' || lft[ 0 ] === 'Format' ) {
			l++;
			if ( pos - l - 1 < 0 ) {
				// start of document
				return true;
			}
			lft[ lft.length - 1 ] = getProperty( string.read( pos - l - 1 ) );
		}

		// Do not break between most letters.
		// WB5: (ALetter | Hebrew_Letter) × (ALetter | Hebrew_Letter)
		if (
			( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' ) &&
			( rgt[ 0 ] === 'ALetter' || rgt[ 0 ] === 'HebrewLetter' )
		) {
			return false;
		}

		// Some tests beyond this point require more context, as per WB4 ignore Format and Extend.
		do {
			r++;
			nextRgt = getProperty( string.read( pos + r ) );
		} while ( nextRgt === 'Extend' || nextRgt === 'Format' );
		rgt.push( nextRgt );
		do {
			l++;
			nextLft = getProperty( string.read( pos - l - 1 ) );
		} while ( nextLft === 'Extend' || nextLft === 'Format' );
		lft.push( nextLft );

		switch ( true ) {
			// Do not break letters across certain punctuation.
			// WB6: (ALetter | Hebrew_Letter) × (MidLetter | MidNumLet | Single_Quote) (ALetter | Hebrew_Letter)
			case ( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' ) &&
				( rgt[ 1 ] === 'ALetter' || rgt[ 1 ] === 'HebrewLetter' ) &&
				( rgt[ 0 ] === 'MidLetter' || rgt[ 0 ] === 'MidNumLet' || rgt[ 0 ] === 'SingleQuote' ):
			// WB7: (ALetter | Hebrew_Letter) (MidLetter | MidNumLet | Single_Quote) × (ALetter | Hebrew_Letter)
			case ( rgt[ 0 ] === 'ALetter' || rgt[ 0 ] === 'HebrewLetter' ) &&
				( lft[ 1 ] === 'ALetter' || lft[ 1 ] === 'HebrewLetter' ) &&
				( lft[ 0 ] === 'MidLetter' || lft[ 0 ] === 'MidNumLet' || lft[ 0 ] === 'SingleQuote' ):
			// WB7a: Hebrew_Letter × Single_Quote
			case lft[ 0 ] === 'HebrewLetter' && rgt[ 0 ] === 'SingleQuote':
			// WB7b: Hebrew_Letter × Double_Quote Hebrew_Letter
			case lft[ 0 ] === 'HebrewLetter' && rgt[ 0 ] === 'DoubleQuote' && rgt[ 1 ] === 'HebrewLetter':
			// WB7c: Hebrew_Letter Double_Quote × Hebrew_Letter
			case lft[ 1 ] === 'HebrewLetter' && lft[ 0 ] === 'DoubleQuote' && rgt[ 0 ] === 'HebrewLetter':

			// Do not break within sequences of digits, or digits adjacent to letters (“3a”, or “A3”).
			// WB8: Numeric × Numeric
			case lft[ 0 ] === 'Numeric' && rgt[ 0 ] === 'Numeric':
			// WB9: (ALetter | Hebrew_Letter) × Numeric
			case ( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' ) && rgt[ 0 ] === 'Numeric':
			// WB10: Numeric × (ALetter | Hebrew_Letter)
			case lft[ 0 ] === 'Numeric' && ( rgt[ 0 ] === 'ALetter' || rgt[ 0 ] === 'HebrewLetter' ):
				return false;

			// Do not break within sequences, such as “3.2” or “3,456.789”.
			// WB11: Numeric (MidNum | MidNumLet | Single_Quote) × Numeric
			case rgt[ 0 ] === 'Numeric' && lft[ 1 ] === 'Numeric' &&
				( lft[ 0 ] === 'MidNum' || lft[ 0 ] === 'MidNumLet' || lft[ 0 ] === 'SingleQuote' ):
			// WB12: Numeric × (MidNum | MidNumLet | Single_Quote) Numeric
			case lft[ 0 ] === 'Numeric' && rgt[ 1 ] === 'Numeric' &&
				( rgt[ 0 ] === 'MidNum' || rgt[ 0 ] === 'MidNumLet' || rgt[ 0 ] === 'SingleQuote' ):
				return false;

			// Do not break between Katakana.
			// WB13: Katakana × Katakana
			case lft[ 0 ] === 'Katakana' && rgt[ 0 ] === 'Katakana':
				return false;

			// Do not break from extenders.
			// WB13a: (ALetter | Hebrew_Letter | Numeric | Katakana | ExtendNumLet) × ExtendNumLet
			case rgt[ 0 ] === 'ExtendNumLet' &&
				( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' || lft[ 0 ] === 'Numeric' || lft[ 0 ] === 'Katakana' || lft[ 0 ] === 'ExtendNumLet' ):
			// WB13b: ExtendNumLet × (ALetter | Hebrew_Letter | Numeric | Katakana)
			case lft[ 0 ] === 'ExtendNumLet' &&
				( rgt[ 0 ] === 'ALetter' || rgt[ 0 ] === 'HebrewLetter' || rgt[ 0 ] === 'Numeric' || rgt[ 0 ] === 'Katakana' ):
				return false;

			// Do not break between regional indicator symbols.
			// WB13c: Regional_Indicator × Regional_Indicator
			case lft[ 0 ] === 'RegionalIndicator' && rgt[ 0 ] === 'RegionalIndicator':
				return false;
		}
		// Otherwise, break everywhere (including around ideographs).
		// WB14: Any ÷ Any
		return true;
	};
}() );
