/*!
 * UnicodeJS Word Break module
 *
 * Implementation of Unicode 13.0.0 Default Word Boundary Specification
 * http://www.unicode.org/reports/tr29/#Default_Word_Boundaries
 *
 * @copyright 2013-2018 UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/* eslint-disable no-fallthrough */

( function () {
	var property,
		properties = unicodeJS.wordbreakproperties,
		emojiProperties = unicodeJS.emojiproperties,
		/**
		 * @class unicodeJS.wordbreak
		 * @singleton
		 */
		wordbreak = unicodeJS.wordbreak = {},
		patterns = {},
		ZWJ_FE = /^(Format|Extend|ZWJ)$/;

	// build regexes
	for ( property in properties ) {
		patterns[ property ] = new RegExp(
			unicodeJS.charRangeArrayRegexp( properties[ property ] )
		);
	}
	for ( property in emojiProperties ) {
		patterns[ property ] = new RegExp(
			unicodeJS.charRangeArrayRegexp( emojiProperties[ property ] )
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
		var lastProperty, codepoint,
			// when moving backwards, use the character to the left of the cursor
			nextCodepoint = direction > 0 ? string.nextCodepoint.bind( string ) : string.prevCodepoint.bind( string ),
			prevCodepoint = direction > 0 ? string.prevCodepoint.bind( string ) : string.nextCodepoint.bind( string );

		// Search for the next break point
		while ( ( codepoint = nextCodepoint( pos ) ) !== null ) {
			pos += codepoint.length * direction;
			if ( unicodeJS.wordbreak.isBreak( string, pos ) ) {
				// Check previous character was alpha-numeric if required
				if ( onlyAlphaNumeric ) {
					lastProperty = getProperty( prevCodepoint( pos ) );
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
		return pos;
	};

	/**
	 * Evaluates whether a position within some text is a word boundary.
	 *
	 * The text object elements may be codepoints or code units
	 *
	 * @param {unicodeJS.TextString} string TextString
	 * @param {number} pos Character position
	 * @return {boolean} Is the position a word boundary
	 */
	wordbreak.isBreak = function ( string, pos ) {
		var nextCodepoint, prevCodepoint, nextProperty, prevProperty,
			regional, n,
			lft = [],
			rgt = [],
			l = 0,
			r = 0;

		// Table 3a. Word_Break Rule Macros
		// Macro        Represents
		// AHLetter     (ALetter | Hebrew_Letter)
		// MidNumLetQ   (MidNumLet | Single_Quote)

		// Break at the start and end of text, unless the text is empty.
		// WB1: sot ÷ Any
		// WB2: Any ÷ eot
		if ( string.read( pos - 1 ) === null || string.read( pos ) === null ) {
			return true;
		}

		// Do not break inside surrogate pair
		if ( string.isMidSurrogate( pos ) ) {
			return false;
		}

		// Get some context
		nextCodepoint = string.nextCodepoint( pos + r );
		prevCodepoint = string.prevCodepoint( pos - l );
		rgt.push( getProperty( nextCodepoint ) );
		lft.push( getProperty( prevCodepoint ) );
		r += nextCodepoint.length;
		l += prevCodepoint.length;

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
			// Do not break within emoji zwj sequences.
			// WB3c: ZWJ × \p{Extended_Pictographic}
			case lft[ 0 ] === 'ZWJ' && rgt[ 0 ] === 'ExtendedPictographic':
				return false;
			// Do not break within emoji zwj sequences.
			// WB3d: Keep horizontal whitespace together.
			case lft[ 0 ] === 'WSegSpace' && rgt[ 0 ] === 'WSegSpace':
				return false;
		}

		// Ignore Format and Extend characters, except after sot, CR, LF, and Newline.
		// (See Section 6.2, Replacing Ignore Rules.) This also has the effect of: Any × (Format | Extend | ZWJ)
		// WB4: X (Extend | Format | ZWJ)* → X
		if ( rgt[ 0 ] && rgt[ 0 ].match( ZWJ_FE ) ) {
			// The Extend|Format character is to the right, so it is attached
			// to a character to the left, don't split here
			return false;
		}
		// We've reached the end of an ZWJ_FE sequence, collapse it
		while ( lft[ 0 ] && lft[ 0 ].match( ZWJ_FE ) ) {
			if ( pos - l <= 0 ) {
				// start of document
				return true;
			}
			prevCodepoint = string.prevCodepoint( pos - l );
			lft[ 0 ] = getProperty( prevCodepoint );
			l += prevCodepoint.length;
		}

		// Do not break between most letters.
		// WB5: AHLetter × AHLetter
		if (
			( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' ) &&
			( rgt[ 0 ] === 'ALetter' || rgt[ 0 ] === 'HebrewLetter' )
		) {
			return false;
		}

		// Some tests beyond this point require more context, as per WB4 ignore ZWJ_FE.
		do {
			nextCodepoint = string.nextCodepoint( pos + r );
			if ( nextCodepoint === null ) {
				nextProperty = null;
				break;
			}
			r += nextCodepoint.length;
			nextProperty = getProperty( nextCodepoint );
		} while ( nextProperty && nextProperty.match( ZWJ_FE ) );
		rgt.push( nextProperty );
		do {
			prevCodepoint = string.prevCodepoint( pos - l );
			if ( prevCodepoint === null ) {
				prevProperty = null;
				break;
			}
			l += prevCodepoint.length;
			prevProperty = getProperty( prevCodepoint );
		} while ( prevProperty && prevProperty.match( ZWJ_FE ) );
		lft.push( prevProperty );

		switch ( true ) {
			// Do not break letters across certain punctuation.
			// WB6: AHLetter × (MidLetter | MidNumLetQ) AHLetter
			case ( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' ) &&
				( rgt[ 1 ] === 'ALetter' || rgt[ 1 ] === 'HebrewLetter' ) &&
				( rgt[ 0 ] === 'MidLetter' || rgt[ 0 ] === 'MidNumLet' || rgt[ 0 ] === 'SingleQuote' ):
			// WB7: AHLetter (MidLetter | MidNumLetQ) × AHLetter
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
			// WB9: AHLetter × Numeric
			case ( lft[ 0 ] === 'ALetter' || lft[ 0 ] === 'HebrewLetter' ) && rgt[ 0 ] === 'Numeric':
			// WB10: Numeric × AHLetter
			case lft[ 0 ] === 'Numeric' && ( rgt[ 0 ] === 'ALetter' || rgt[ 0 ] === 'HebrewLetter' ):
				return false;

			// Do not break within sequences, such as “3.2” or “3,456.789”.
			// WB11: Numeric (MidNum | MidNumLetQ) × Numeric
			case rgt[ 0 ] === 'Numeric' && lft[ 1 ] === 'Numeric' &&
				( lft[ 0 ] === 'MidNum' || lft[ 0 ] === 'MidNumLet' || lft[ 0 ] === 'SingleQuote' ):
			// WB12: Numeric × (MidNum | MidNumLetQ) Numeric
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

			// Do not break within emoji modifier sequences.
			// WB14: (E_Base | EBG) × E_Modifier
			case ( lft[ 0 ] === 'EBase' || lft[ 0 ] === 'EBaseGAZ' ) && rgt[ 0 ] === 'EModifier':
				return false;
		}

		// Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
		// WB15: ^ (RI RI)* RI × RI
		// WB16: [^RI] (RI RI)* RI × RI
		if ( lft[ 0 ] === 'RegionalIndicator' && rgt[ 0 ] === 'RegionalIndicator' ) {
			// Count RIs on the left
			regional = 0;
			n = 0;

			do {
				prevCodepoint = string.prevCodepoint( pos - n );
				if ( prevCodepoint === null ) {
					break;
				}
				n += prevCodepoint.length;
				prevProperty = getProperty( prevCodepoint );
				if ( prevProperty === 'RegionalIndicator' ) {
					regional++;
				}
			} while ( prevProperty === 'RegionalIndicator' || ( prevProperty && prevProperty.match( ZWJ_FE ) ) );
			if ( regional % 2 === 1 ) {
				return false;
			}

		}
		// Otherwise, break everywhere (including around ideographs).
		// WB999: Any ÷ Any
		return true;
	};
}() );
