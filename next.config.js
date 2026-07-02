/** @type {import("next").NextConfig} */
const nextConfig = {
    images            : {
        unoptimized : true,
    },
    transpilePackages : ["@rbi-pratirupa/shared-ui"],
    webpack           : (config, options) => {
        // Add SVG loader
        config.module.rules.push({
            test : /\.svg$/,
            use  : [
                options.defaultLoaders.babel,
                {
                    loader  : "@svgr/webpack",
                    options : { babel : false },
                },
            ],
        });
        return config;
    },
    // Enable static optimization and faster route loading
    // swcMinify: true,
    // Automatically prefetch resources for faster navigation
    reactStrictMode   : true,
};

module.exports = nextConfig;
