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

router
  .route('/bloodpressure')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getAllBloodPressureReadings();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });


 router
  .route('/bloodpressurehistory/:id')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getBloodPressureHistory(req.params.id, req.query.pageSize || 10);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

 router
  .route('/avgbloodpressure')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.averageBloodPressure();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

router
  .route('/glucoselevel')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getAllGlucoseLevelReadings();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  });

 router
  .route('/avgglucoselevel')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.averageGlucoseLevel();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

 router
  .route('/getglucoselevelhistory/:id')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getGlucoseLevelHistory(req.params.id, req.query.pageSize || 10);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

 router
  .route('/getavgmeals/:id')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getAverageMealsPerDay(req.params.id);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

 router
  .route('/avgSessionTime')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getAvgSessionTime();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

 router
  .route('/getAllSessionTimes')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getAllSessionTimes();

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

  router
  .route('/getSessionTimesSince/:date')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      console.log(req.params.date)

      const user = await metricData.getAllSessionTimesSince(req.params.date);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

  router
  .route('/getSessionTimesBetween/:startDate/:endDate')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.getAllSessionMetricsBetween(req.params.startDate, req.params.endDate);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

  router
  .route('/getSessionTimeOnDate/:date')
  .get(async (req, res) => {
    try{
      if(req.user.role !== 'super admin' || !req.user){
        return res.status(403).json({ error: "Forbidden" });
      }

      const user = await metricData.averageSessionTimeOnDay(req.params.date);

      return res.status(200).json( user )
      
    } catch (e) {
      return res.status(400).json({ error: e }) 
    }
  }); 

export default router