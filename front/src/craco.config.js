module.exports = {
    devServer: (devServerConfig) => {
      devServerConfig.setupMiddlewares = (middlewares, devServer) => {
        // Configura middlewares aquí
        return middlewares;
      };
      return devServerConfig;
    },
  };
  