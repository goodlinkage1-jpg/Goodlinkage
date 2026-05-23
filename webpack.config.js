const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load .env locally, but prioritize process.env (Vercel injects here)
const localEnv = dotenv.config().parsed || {};
const env = {
  ...localEnv,
  ...process.env
};

// Filter for REACT_APP_* variables (frontend convention)
const envKeys = {};
Object.keys(env).forEach(key => {
  if (key.startsWith('REACT_APP_')) {
    envKeys[key] = env[key];
  }
});

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'Images/'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    // ✅ FIXED — injects REACT_APP_* variables into the browser bundle (works on Vercel)
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(envKeys),
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 3000,
    open: true,
    historyApiFallback: true
  },
};