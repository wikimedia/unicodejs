/*!
 * Mark development build.
 *
 * E.g. output produced from `npm test`, instead of `npm run build`.
 */

'use strict';

module.exports = function ( grunt ) {
	grunt.registerTask( 'set-dev', function () {
		grunt.config.set( 'build.version', grunt.config( 'build.version' ) + '-dev' );
	} );
};
