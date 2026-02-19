import { Router } from "express";
import * as metricData from "../data/metrics.js";

const router = Router()

router
  .route('/patients')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      console.log(req.query.pageSize, req.query.pageNum)

      const user = await metricData.getPatients(req.query.pageSize || 10, req.query.pageNum || 1);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/numberofpatients')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
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
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getPatient(req.params.id);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/doctors')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      console.log(req.query.pageSize, req.query.pageNum)

      const user = await metricData.getDoctors(req.query.pageSize || 10, req.query.pageNum || 1);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/numberofdoctors')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getNumberOfDoctors();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/doctor/:id')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getDoctor(req.params.id);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/doctor/:id/patients')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getPatientsPerDoctor(req.params.id, req.query.pageSize || 10, req.query.pageNum || 1);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

router
  .route('/doctor/:id/numpatients')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getNumberOfPatientsPerDoctor(req.params.id);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });




export default router;