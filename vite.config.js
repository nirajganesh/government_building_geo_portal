export default {
    build: {
        sourcemap: true,
    },
    server: {
        proxy: {
            '/giscg': {
                target: 'https://cggis.cgstate.gov.in',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path
            },
            '/bisaglayerstatus': {
                target: 'https://cggis.cgstate.gov.in',
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path
            }
        }
    }
}
