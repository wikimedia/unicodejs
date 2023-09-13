/*!
 * UnicodeJS character classes
 *
 * Support for unicode equivalents of JS regex character classes
 *
 * @copyright 2013–2018 UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */
( function () {
	/**
	 * @namespace unicodeJS.characterclass
	 */
	var basicLatinDigitRange = [ 0x30, 0x39 ],
		joinControlRange = [ 0x200C, 0x200D ],
		characterclass = unicodeJS.characterclass = {};

	/**
	 * @memberof unicodeJS.characterclass
	 * @property {Object}
	 */
	characterclass.patterns = {
		// \w is defined in http://unicode.org/reports/tr18/
		word: unicodeJS.charRangeArrayRegexp( [].concat(
			unicodeJS.derivedcoreproperties.Alphabetic,
			unicodeJS.derivedgeneralcategories.M,
			[ basicLatinDigitRange ],
			unicodeJS.derivedgeneralcategories.Pc,
			[ joinControlRange ]
		) )
	};
}() );
