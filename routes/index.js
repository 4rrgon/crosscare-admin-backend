import authRoutes from "./auth_routes.js"
import metricRoutes from "./metric_routes.js"

const constructorMethod = (app) => {
    app.use('/', authRoutes);
    app.use('/metrics', metricRoutes);
    app.use('*', (req, res) => {
        return res.status(404).json({error: 'Not found'});
    });
};
  
export default constructorMethod;