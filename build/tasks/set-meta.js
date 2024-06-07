/*!
 * Set build metadata.
 */

'use strict';

module.exports = function ( grunt ) {

	grunt.registerTask( 'set-meta', () => {
		const cp = require( 'child_process' );

		// Support reproducible builds from only the source code
		// https://reproducible-builds.org/docs/source-date-epoch/
		let releaseEpoch;
		try {
			releaseEpoch = process.env.SOURCE_DATE_EPOCH || cp.execSync( 'git log -s --format=%at -1' );
		} catch ( e ) {
			grunt.log.err( e );
			return false;
		}
		grunt.config.set( 'build.year', new Date( releaseEpoch * 1000 ).getUTCFullYear() );
		grunt.config.set( 'build.version', require( '../../package.json' ).version );
	} );

};
