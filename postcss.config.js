// const caniuse = require('caniuse-api');

// let LATEST_STABLE_BROWSERS = {};
// caniuse.getLatestStableBrowsers().map(browser => {
//     browser = browser.split(' ');
//     LATEST_STABLE_BROWSERS[browser[0]] = parseFloat(browser[1]);
// });

// function getBrowserSupportedVersion(name) {
//     const version = LATEST_STABLE_BROWSERS[name];

//     return ['chrome', 'opera', 'firefox'].includes(name)
//         ? version - 5
//         : version;
// }

module.exports = {
    plugins: [
        require('postcss-simple-vars'),
        require('postcss-import'),
        require('postcss-sassy-mixins'),
        require('postcss-nested'),
        require('postcss-extend'),
        require('postcss-size'),
        require('postcss-media-minmax'),
        require('postcss-clearfix'),
        require('postcss-conditionals'),
        require('postcss-hexrgba'),
        require('autoprefixer')({
            browsers: [
                // `Chrome > ${getBrowserSupportedVersion('chrome')}`,
                // `Firefox > ${getBrowserSupportedVersion('firefox')}`,
                // `Opera > ${getBrowserSupportedVersion('opera')}`,
                'Chrome > 55',
                'Firefox > 50',
                'Opera > 41',
                'Android > 4',
                'Explorer > 9',
                'iOS > 7',
                'Safari > 8',
            ],
        }),
    ],
};
