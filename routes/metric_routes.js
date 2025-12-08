import { Router } from "express";
import * as metricData from "../data/metrics.js";

const router = Router()

router
  .route('/patients')
  .get(async (req, res) => {
    try{
      if(req.session.user.role !== 'super admin' || !req.session.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getPatients();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/numberofpatients')
  .get(async (req, res) => {
    try{
      if(req.session.user.role !== 'super admin' || !req.session.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getNumberOfPatients();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });


router
  .route('/patient/:id')
  .get(async (req, res) => {
    try{
      if(req.session.user.role !== 'super admin' || !req.session.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getPatient(req.params.id);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });



export default router;