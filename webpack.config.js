module.exports = {
    mode: "production",
    module: {
        rules: [{
            test: /\.s?css$/,
            loader: ['raw-loader', 'sass-loader']
        }]
    }
}