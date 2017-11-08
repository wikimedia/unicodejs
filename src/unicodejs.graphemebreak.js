/*!
 * UnicodeJS Grapheme Break module
 *
 * Implementation of Unicode 10.0.0 Default Grapheme Cluster Boundary Specification
 * http://www.unicode.org/reports/tr29/#Default_Grapheme_Cluster_Table
 *
 * @copyright 2013–2018 UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */
( function () {
	var property, disjunction, graphemeBreakRegexp, combiningMark,
		properties = unicodeJS.graphemebreakproperties,
		// Single unicode character (either a UTF-16 code unit or a surrogate pair)
		oneCharacter = '[^\\ud800-\\udfff]|[\\ud800-\\udbff][\\udc00-\\udfff]',
		/**
		 * @class unicodeJS.graphemebreak
		 * @singleton
		 */
		graphemebreak = unicodeJS.graphemebreak = {},
		patterns = {};

	// build regexes
	for ( property in properties ) {
		patterns[ property ] = unicodeJS.charRangeArrayRegexp( properties[ property ] );
	}

	combiningMark = '(?:' + patterns.Extend + '|' + patterns.SpacingMark + ')';

	// Build disjunction for grapheme cluster split
	// See http://www.unicode.org/reports/tr29/ at "Grapheme Cluster Boundary Rules"
	disjunction = [
		// Break at the start and end of text, unless the text is empty.
		// GB1: sot ÷ Any
		// GB2: Any ÷ eot
		// GB1 and GB2 are trivially satisfied

		// Do not break between a CR and LF. Otherwise, break before and after controls.
		// GB3: CR × LF
		patterns.CR + patterns.LF,

		// GB4: ( Control | CR | LF ) ÷
		// GB5: ÷ ( Control | CR | LF )
		'(?:' + patterns.Control + '|' +
		patterns.CR + '|' +
		patterns.LF + ')',

		// Do not break Hangul syllable sequences.
		// GB6: L × ( L | V | LV | LVT )
		// GB7: ( LV | V ) × ( V | T )
		// GB8: ( LVT | T ) × T
		// L* V+ T*
		'(?:' + patterns.L + ')*' +
			'(?:' + patterns.V + ')+' +
			'(?:' + patterns.T + ')*' +
			combiningMark + '*',

		// L* LV V* T*
		'(?:' + patterns.L + ')*' +
			'(?:' + patterns.LV + ')' +
			'(?:' + patterns.V + ')*' +
			'(?:' + patterns.T + ')*' +
			combiningMark + '*',

		// L* LVT T*
		'(?:' + patterns.L + ')*' +
			'(?:' + patterns.LVT + ')' +
			'(?:' + patterns.T + ')*' +
			combiningMark + '*',

		// L+
		'(?:' + patterns.L + ')+' +
			combiningMark + '*',

		// T+
		'(?:' + patterns.T + ')+' +
			combiningMark + '*',

		'(?:' + oneCharacter + ')' +
			'(?:' +
				// Do not break before extending characters or ZWJ.
				// GB9 × ( Extend | ZWJ )
				// TODO: this will break if the extended thing is not oneCharacter
				// e.g. hangul jamo L+V+T. Does it matter?
				patterns.Extend + '|' +
				patterns.ZWJ + '|' +

				// Only for extended grapheme clusters:
				// Do not break before SpacingMarks, or after Prepend characters.
				// GB9a: × SpacingMark
				patterns.SpacingMark +
			')+',

		// GB9b: Prepend ×
		// Not required

		// Do not break within emoji modifier sequences or emoji zwj sequences.
		// GB10: ( E_Base | EBG ) Extend* × E_Modifier
		// GB11: ZWJ × ( Glue_After_Zwj | EBG )
		// Not required

		// Do not break between regional indicator symbols.
		// GB12: ^ (RI RI)* RI × RI
		// GB13: [^RI] (RI RI)* RI × RI
		// NEWTODO: update
		'(?:' +
			patterns.RegionalIndicator +
			')+' +
			combiningMark + '*',

		// Otherwise, break everywhere.
		// GB999: Any ÷ Any
		// Taking care not to split surrogates
		oneCharacter
	];
	graphemeBreakRegexp = new RegExp( '(' + disjunction.join( '|' ) + ')' );

	/**
	 * Split a string into grapheme clusters.
	 *
	 * @param {string} text Text to split
	 * @return {string[]} Array of clusters
	 */
	graphemebreak.splitClusters = function ( text ) {
		var i, parts, length, clusters = [];
		parts = text.split( graphemeBreakRegexp );
		for ( i = 0, length = parts.length; i < length; i++ ) {
			if ( parts[ i ] !== '' ) {
				clusters.push( parts[ i ] );
			}
		}
		return clusters;
	};
}() );
