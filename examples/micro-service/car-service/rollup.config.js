import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
//import pkg from './package.json'

const env = process.env.NODE_ENV

const config = {
  input: 'src/index.js',
  //external: Object.keys(pkg.peerDependencies || {}),
  external: ['@pihanga/core'],
  output: {
    format: 'umd',
    name: 'N1_VDBS',
    globals: {
  //    react: 'React',
//      redux: 'Redux',
      '@pihanga/core': 'Pihanga.Core'
    }
  },
  plugins: [
    nodeResolve({
      jsnext: true,
      extensions: ['.js', '.jsx', '.json']
    }),
    babel({
      exclude: '**/node_modules/**',
      runtimeHelpers: true
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env)
    }),
    commonjs({
      namedExports: {
        'node_modules/react-is/index.js': [
          'isValidElementType',
          'isContextConsumer'
        ]
      }
    })
  ]
}

if (env === 'production') {
  config.plugins.push(
    terser({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false
      }
    })
  )
}

export default config
