/*!
 * UnicodeJS TextString class.
 *
 * @copyright 2013-2018 UnicodeJS team and others; see AUTHORS.txt
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
	this.text = text;
};

/* Methods */

/**
 * Read code unit at specified position
 *
 * @method
 * @param {number} position Position to read from
 * @return {string|null} Code unit, or null if out of bounds
 */
unicodeJS.TextString.prototype.read = function ( position ) {
	const dataAt = this.text[ position ];
	return dataAt !== undefined ? dataAt : null;
};

/**
 * Read unicode codepoint after the specified offset
 *
 * This is the same as the code unit (=Javascript character) at that offset,
 * unless a valid surrogate pair ends at that code unit. (This is consistent
 * with the behaviour of String.prototype.codePointAt)
 *
 * @param {number} position Position
 * @return {string|null} Unicode codepoint, or null if out of bounds
 */
unicodeJS.TextString.prototype.nextCodepoint = function ( position ) {
	const codeUnit = this.read( position );

	if ( unicodeJS.isLeadingSurrogate( codeUnit ) ) {
		const nextCodeUnit = this.read( position + 1 );
		if ( unicodeJS.isTrailingSurrogate( nextCodeUnit ) ) {
			return codeUnit + nextCodeUnit;
		}
	}
	return codeUnit;
};

/**
 * Read unicode codepoint before the specified offset
 *
 * This is the same as the code unit (=Javascript character) at the previous
 * offset, unless a valid surrogate pair ends at that offset.
 *
 * @param {number} position Position
 * @return {string|null} Unicode codepoint, or null if out of bounds
 */
unicodeJS.TextString.prototype.prevCodepoint = function ( position ) {
	const codeUnit = this.read( position - 1 );

	if ( unicodeJS.isTrailingSurrogate( codeUnit ) ) {
		const prevCodeUnit = this.read( position - 2 );
		if ( unicodeJS.isLeadingSurrogate( prevCodeUnit ) ) {
			return prevCodeUnit + codeUnit;
		}
	}
	return codeUnit;
};

/**
 * Check if the current offset is in the middle of a surrogate pair
 *
 * @param {number} position Position
 * @return {boolean}
 */
unicodeJS.TextString.prototype.isMidSurrogate = function ( position ) {
	return unicodeJS.isLeadingSurrogate( this.read( position - 1 ) ) &&
		unicodeJS.isTrailingSurrogate( this.read( position ) );
};

/**
 * Get as a plain string
 *
 * @return {string} Plain javascript string
 */
unicodeJS.TextString.prototype.toString = function () {
	return this.text;
};
