const path = require('path');

module.exports = {
  // mode: 'development',
  mode: 'production',
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env'
              ]
            }
          }
        ]
      }
    ]
  },
  output: {
    filename: 'main.js',
    path: path.join(process.cwd(), 'docs/js'),
  },
  devServer: {
    static: {
      directory: './docs',
    },
    hot: true,
  },
  target: ['web', 'es5']
};
