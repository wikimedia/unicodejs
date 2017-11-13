/*!
 * UnicodeJS TextString class.
 *
 * @copyright 2013–2015 UnicodeJS team and others; see AUTHORS.txt
 * @license The MIT License (MIT); see LICENSE.txt
 */

/**
 * This class provides a simple interface to fetching plain text
 * from a data source. The base class reads data from a string, but
 * an extended class could provide access to a more complex structure,
 * e.g. an array or an HTML document tree.
 *
 * @class unicodeJS.TextString
 * @constructor
 * @param {string} text Text
 */
unicodeJS.TextString = function UnicodeJSTextString( text ) {
	this.codepoints = unicodeJS.splitCharacters( text );
};

/* Methods */

/**
 * Read unicode codepoint at specified position
 *
 * @method
 * @param {number} position Position to read from
 * @return {string|null} Unicode codepoint, or null if out of bounds
 */
unicodeJS.TextString.prototype.read = function ( position ) {
	var codepointAt = this.codepoints[ position ];
	return codepointAt !== undefined ? codepointAt : null;
};

/**
 * Return number of codepoints in the text string
 *
 * @method
 * @return {number} Number of codepoints
 */
unicodeJS.TextString.prototype.getLength = function () {
	return this.codepoints.length;
};

/**
 * Get as a plain string
 *
 * @return {string} Plain javascript string
 */
unicodeJS.TextString.prototype.toString = function () {
	return this.codepoints.join( '' );
};
