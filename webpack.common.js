require('dotenv').config();

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const { DefinePlugin } = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function ({
  onlyTranspileTypescript = false,
  experimentalFeatures = false,
  snap = false,
} = {}) {
  const moduleConfig = {
    rules: [
      {
        test: /\.ts$/,
        use: [
          'babel-loader',
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: onlyTranspileTypescript,
            },
          },
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        sideEffects: true,
        test: /\.(png|html)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  };

  const resolve = {
    extensions: ['.ts', '.js'],
    alias: {
      '@web': path.resolve(__dirname, 'web/app/assets/javascripts'),
    },
  };

  const electronMainConfig = {
    entry: {
      index: './app/index.ts',
    },
    output: {
      path: path.resolve(__dirname, 'app', 'dist'),
      filename: 'index.js',
    },
    devtool: 'inline-cheap-source-map',
    target: 'electron-main',
    node: {
      __dirname: false,
    },
    resolve,
    module: moduleConfig,
    externals: {
      keytar: 'commonjs keytar',
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          exclude: ['extensions', 'vendor', 'web', 'node_modules'],
        }),
      ],
    },
    plugins: [
      new DefinePlugin({
        EXPERIMENTAL_FEATURES: JSON.stringify(experimentalFeatures),
        AUTO_UPDATING_AVAILABLE: JSON.stringify(snap ? false : true),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: 'app/extensions',
            to: 'extensions',
          },
          {
            from: 'app/vendor',
            to: 'vendor',
          },
          {
            from: 'web/dist',
            to: 'standard-notes-web',
          },
          {
            from: 'app/node_modules',
            to: 'node_modules',
          },
          {
            from: 'app/stylesheets/renderer.css',
            to: 'stylesheets/renderer.css',
          },
          {
            from: 'app/icon',
            to: 'icon',
          },
        ],
      }),
    ],
  };

  const electronRendererConfig = {
    entry: {
      preload: './app/javascripts/renderer/preload.js',
      renderer: './app/javascripts/renderer/renderer.ts',
      grantKeyringAccess: './app/javascripts/renderer/grantKeyringAccess.ts',
    },
    output: {
      path: path.resolve(__dirname, 'app', 'dist', 'javascripts', 'renderer'),
      publicPath: '/',
    },
    target: 'electron-renderer',
    devtool: 'inline-cheap-source-map',
    node: {
      __dirname: false,
    },
    resolve,
    module: moduleConfig,
    externals: {
      electron: 'commonjs electron',
      'sn-electron-valence/Transmitter':
        'commonjs sn-electron-valence/Transmitter',
    },
    plugins: [
      new webpack.DefinePlugin({
        DEFAULT_SYNC_SERVER: JSON.stringify(
          process.env.DEFAULT_SYNC_SERVER || 'https://sync.standardnotes.org'
        ),
        BUGSNAG_API_KEY: JSON.stringify(process.env.BUGSNAG_API_KEY),
        EXPERIMENTAL_FEATURES: JSON.stringify(experimentalFeatures),
      }),
    ],
  };
  return [electronMainConfig, electronRendererConfig];
};
