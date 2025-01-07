/*!
 * UnicodeJS Grapheme Break module
 *
 * Implementation of Unicode 15.0.0 Default Grapheme Cluster Boundary Specification
 * http://www.unicode.org/reports/tr29/#Default_Grapheme_Cluster_Table
 *
 * @copyright 2013– UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */
( function () {
	var properties = unicodeJS.graphemebreakproperties,
		emojiProperties = unicodeJS.emojiproperties,
		/**
		 * @namespace unicodeJS.graphemebreak
		 */
		graphemebreak = unicodeJS.graphemebreak = {},
		patterns = {};

	var property;
	// build regexes
	for ( property in properties ) {
		// eslint-disable-next-line security/detect-non-literal-regexp
		patterns[ property ] = new RegExp(
			unicodeJS.charRangeArrayRegexp( properties[ property ] )
		);
	}
	for ( property in emojiProperties ) {
		// eslint-disable-next-line security/detect-non-literal-regexp
		patterns[ property ] = new RegExp(
			unicodeJS.charRangeArrayRegexp( emojiProperties[ property ] )
		);
	}

	function getProperty( codepoint ) {
		for ( property in patterns ) {
			if ( patterns[ property ].test( codepoint ) ) {
				return property;
			}
		}
		return null;
	}

	/**
	 * Split text into grapheme clusters
	 *
	 * @memberof unicodeJS.graphemebreak
	 * @param {string} text Text to split
	 * @return {string[]} Split text
	 */
	graphemebreak.splitClusters = function ( text ) {
		return text.split( /(?![\uDC00-\uDFFF])/g ).reduce( ( clusters, codepoint, i, codepoints ) => {
			function isBreak() {
				var lft = [];

				// Break at the start and end of text, unless the text is empty.
				// GB1: sot ÷ Any
				// GB2: Any ÷ eot
				if ( i === 0 || i === codepoints.length ) {
					return true;
				}

				lft.push( getProperty( codepoints[ i - 1 ] ) );
				// No rules currently require us to look ahead.
				var rgt = getProperty( codepoint );

				// Do not break between a CR and LF. Otherwise, break before and after controls.
				// GB3: CR × LF
				if ( lft[ 0 ] === 'CR' && rgt === 'LF' ) {
					return false;
				}

				// GB4: ( Control | CR | LF ) ÷
				// GB5: ÷ ( Control | CR | LF )
				if (
					[ 'Control', 'CR', 'LF' ].indexOf( lft[ 0 ] ) !== -1 ||
					[ 'Control', 'CR', 'LF' ].indexOf( rgt ) !== -1
				) {
					return true;
				}

				// Do not break Hangul syllable sequences.
				// GB6: L × ( L | V | LV | LVT )
				if (
					lft[ 0 ] === 'L' &&
					[ 'L', 'V', 'LV', 'LVT' ].indexOf( rgt ) !== -1
				) {
					return false;
				}
				// GB7: ( LV | V ) × ( V | T )
				if (
					[ 'LV', 'V' ].indexOf( lft[ 0 ] ) !== -1 &&
					[ 'V', 'T' ].indexOf( rgt ) !== -1
				) {
					return false;
				}
				// GB8: ( LVT | T ) × T
				if (
					[ 'LVT', 'T' ].indexOf( lft[ 0 ] ) !== -1 &&
					rgt === 'T'
				) {
					return false;
				}

				// Do not break before extending characters or ZWJ.
				// GB9 × ( Extend | ZWJ )
				// The GB9a and GB9b rules only apply to extended grapheme clusters:
				// Do not break before SpacingMarks, or after Prepend characters.
				// GB9a: × SpacingMark
				if ( [ 'Extend', 'ZWJ', 'SpacingMark' ].indexOf( rgt ) !== -1 ) {
					return false;
				}
				// GB9b: Prepend ×
				if ( lft[ 0 ] === 'Prepend' ) {
					return false;
				}

				// Do not break within emoji modifier sequences or emoji zwj sequences.
				// GB11: \p{Extended_Pictographic} Extend* ZWJ × \p{Extended_Pictographic}
				var l = 0;
				if ( rgt === 'ExtendedPictographic' ) {
					if ( lft[ l ] === 'ZWJ' ) {
						l++;
						lft[ l ] = getProperty( codepoints[ i - 1 - l ] );
						while ( lft[ l ] === 'Extend' ) {
							l++;
							lft[ l ] = getProperty( codepoints[ i - 1 - l ] );
						}
						if ( lft[ l ] === 'ExtendedPictographic' ) {
							return false;
						}
					}
				}

				// Do not break within emoji flag sequences. That is, do not break between regional indicator (RI) symbols if there is an odd number of RI characters before the break point.
				// GB12: sot (RI RI)* RI × RI
				// GB13: [^RI] (RI RI)* RI × RI
				l = 0;
				while ( lft[ l ] === 'RegionalIndicator' ) {
					l++;
					lft[ l ] = getProperty( codepoints[ i - 1 - l ] );
				}
				if ( rgt === 'RegionalIndicator' && l % 2 === 1 ) {
					return false;
				}
				// Otherwise, break everywhere.
				// GB999: Any ÷ Any
				return true;
			}

			if ( isBreak() ) {
				clusters.push( codepoint );
			} else {
				// TODO: This is not covered by tests, is it needed?
				// istanbul ignore next
				if ( !clusters.length ) {
					clusters.push( '' );
				}
				clusters[ clusters.length - 1 ] += codepoint;
			}

			return clusters;
		}, [] );
	};
}() );
