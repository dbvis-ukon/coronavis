const webpack = require('webpack');

module.exports = {
  module: {
    rules: [
      {
        test: /\.m?js$/,
        // you can generate a list of modules that are not valid es-5 by running "yarn are-you-es5 check -r ."
        // the output is a valid webpack inclusion/exclusion regex
        exclude: /[\\/]node_modules[\\/](?!(vega|vega-embed|vega-parser|vega-lite)[\\/])/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-proposal-object-rest-spread']
          }
        }
      }
    ]
  }
};
