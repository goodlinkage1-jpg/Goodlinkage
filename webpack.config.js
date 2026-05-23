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

// 🔍 Log for debugging - shows what env vars are being injected
console.log('📦 Webpack Build Environment Variables:');
Object.keys(envKeys).forEach(key => {
  const value = envKeys[key];
  const displayValue = value ? `${value.substring(0, 10)}...` : 'MISSING ⚠️';
  console.log(`  ${key}: ${displayValue}`);
});

if (!envKeys.REACT_APP_GOOGLE_MAPS_KEY) {
  console.warn('⚠️  WARNING: REACT_APP_GOOGLE_MAPS_KEY not set in build environment!');
  console.warn('   On Vercel: Add to Project Settings → Environment Variables');
  console.warn('   Locally: Add to .env file');
}

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
    // ✅ FIXED — Properly injects REACT_APP_* variables into the browser bundle
    // DefinePlugin requires each env var to be individually stringified, not the entire object
    new webpack.DefinePlugin(
      Object.keys(envKeys).reduce((acc, key) => {
        acc[`process.env.${key}`] = JSON.stringify(envKeys[key]);
        return acc;
      }, {})
    ),
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