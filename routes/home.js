var express = require("express");
var router = express.Router();
const UserAuthenticate = require("./middleware/userAuthenticate");
const jwtAuthe = require("./middleware/jwtAuthenticate");
const conn = require("../db.js");

router.get("/", UserAuthenticate.method(), (req, res) => {
  res.send("home");
});

// This it to do the simple count sql queries --------------------------------------------------------------------------
function execute_formatted_count_sql_query(query_string, count_property_id) {
  new Promise(function (resolve, reject) {
    conn.query(
      query_string
      ,
      (error, data) => {
        if (error) {
          return reject(error);
        }
        ret_val = data[0][count_property_id];
        resolve(ret_val);
      }
    );
  });
}

// router.get("/count", (req,res)=>{ -----------------------------------------------------------------------------------
router.get("/count", (req, res) => {
  let agentid = 1;

  var promises = [];

  //Get Total Inquiry
  var prom1 = execute_formatted_count_sql_query(
    `select count(candidateid) as inquiry_total 
      from candidate 
      where 
        enrolled=0 and 
        statusid in(0,1) and 
        clid='${agentid}'`,
    'inquiry_total'
  )
    
  promises.push(prom1);

  // Get Last month Inquiry --------------------------------------------------------------------------------------------
  let fd = "2000/01/01";
  let td = "2020/01/01";
  prom2 = execute_formatted_count_sql_query(
    `select count(candidateid) as inquiry 
        from candidate 
        where 
          enrolled=0 and 
          candidatedt between STR_TO_DATE('${fd}','%Y/%m/%d') and STR_TO_DATE('${td}','%Y/%m/%d') and 
          clid='${agentid}'`,
    'inquiry'
  )

  promises.push(prom2);

  // Get Total Enrollment ----------------------------------------------------------------------------------------------
  prom3 = execute_formatted_count_sql_query(
    `select count(candidateid) as total_enrollment from candidate where enrolled=1 and clid='${agentid}'`,
    'total_enrollment'
  )

  promises.push(prom3);

  // Get Last Month Enrollment -----------------------------------------------------------------------------------------
  prom4 = execute_formatted_count_sql_query(
    `select count(candidateid) as last_mn_enrollment 
        from candidate 
        where 
          enrolled=1 and 
          candidatedt between STR_TO_DATE('${fd}','%Y/%m/%d') and STR_TO_DATE('${td}','%Y/%m/%d') and 
          clid='${agentid}'`,
    'last_mn_enrollment'
  )
  
  promises.push(prom4);

  // Get Pending Followup ----------------------------------------------------------------------------------------------
  prom5 =  execute_formatted_count_sql_query(
    `select 
        COUNT(cd.candidateid) as no_of_followup 
    from candidate cd 
    inner join enrolfollow ef 
        on ef.candidateid = cd.candidateid 
    where 
        cd.enrolled=0 and 
        cd.clid='${agentid}' and 
        cd.statusid in(0,1)`,
    'no_of_followup'
  ) 
  promises.push(prom5);

  // Get Today's Followup ----------------------------------------------------------------------------------------------
  prom6 = execute_formatted_count_sql_query(
    `select 
        COUNT(cd.candidateid) as Today_followup 
    from candidate cd 
    inner join enrolfollow ef 
        on ef.candidateid = cd.candidateid 
    where 
        cd.enrolled=0 and 
        cd.clid='${agentid}' and 
        cd.statusid in(0,1) and 
        ef.nextfollowup=STR_TO_DATE('${curdate}', '%Y/%m/%d')`,
    'Today_followup'
  )

  promises.push(prom6);



  // Get unv_finalising_pend what ever ---------------------------------------------------------------------------------
  prom7 = execute_formatted_count_sql_query(
    `select 
        count(cd.candidateid) as unv_finalising_pend 
    from candidate cd 
    inner join uniliststat uls 
        on cd.candidateid = uls.candidateid 
    where 
        cd.enrolled=1 and cd.clid='${agentid}'`,
    'unv_finalising_pend'
  )
  promises.push(prom7);

  // Get ul_ps_cand what ever ------------------------------------------------------------------------------------------
  prom8 = execute_formatted_count_sql_query(
    `select 
        count(cd.candidateid) as ul_ps_cand
    from candidate cd 
    inner join uniliststat uls 
        on cd.candidateid = uls.candidateid 
    where 
        cd.enrolled=1 and 
        cd.clid='${agentid}' and 
        sendtocand=0`,
    'ul_ps_cand'
  )
  promises.push(prom8);

  // Get ul_ps_cand what ever ------------------------------------------------------------------------------------------
  prom9 = execute_formatted_count_sql_query(
    `select 
        count(cd.candidateid) as st_fa_pend 
    from candidate cd 
    inner join uniliststat uls 
        on cd.candidateid = uls.candidateid 
    where 
        cd.enrolled=1 and 
        cd.clid='${agentid}' and 
        sendtovaibhav=0`,
    'st_fa_pend'
  )
  promises.push(prom9);

  
  // Visa fees pending count -------------------------------------------------------------------------------------------
  prom10 = execute_formatted_count_sql_query(
    `select count(candvisaid) as visa_fee_cnt 
    from candvisa 
    where 
      visafees=0 and 
      candidateid in (select candidateid from candidate where enrolled=1 and clid='${agentid}')`,
    'visa_fee_cnt'
  )
  
  promises.push(prom10);

  //Data for pending fees ----------------------------------------------------------------------------------------------
  let cand_cnt = 0;
  conn.query(
    "select candidateid from candidate where enrolled=1 and clid=" +
      agentid +
      "",
    (error, data) => {
      if (error) {
        return reject(error);
      }
      for (i = 0; i < data.length; i++) {
        candid = data[i].candidateid;

        let en_fee_pend_cnt = 0; //Enrollment fees pending count
        let unass_pend_cnt = 0; //University assist fees pending count
        let tut_fee_cnt = 0; //Tution fees count

        conn.query(
          "select feesid,enroll_amt,uni_assist,tution from fees where candidateid=" +
            candid +
            "",
          (error1, data1) => {
            if (error1) {
              return reject(error);
            }
            if (data1.length > 0) {
              feesid = data1[0].feesid;
              enroll_amt = data1[0].enroll_amt;
              uni_assist = data1[0].uni_assist;
              tution = data1[0].tution;

              let total_emi_paid = 0;

              if (feesid > 0) {
                conn.query(
                  "select sum(amt) as total_emi_paid from feesprt where feesid=" +
                    feesid +
                    "",
                  (error2, data2) => {
                    if (error2) {
                      res.send(error2);
                    }
                    total_emi_paid = data2[0].total_emi_paid;
                  }
                );
              }
              if (enroll_amt > total_emi_paid) {
                en_fee_pend_cnt = en_fee_pend_cnt + 1;
              }

              conn.query(
                "select uniliststatid from uniliststat where candidateid=" +
                  candid +
                  " and finalised=1",
                (error2, data2) => {
                  if (error2) {
                    res.send(error2);
                  }
                  finalised = data2[0].uniliststatid;
                }
              );

              if (uni_assist === 0 && finalised > 0) {
                unass_pend_cnt = unass_pend_cnt + 1;
              }

              if (tution === 0 && finalised > 0) {
                tut_fee_cnt = tut_fee_cnt + 1;
              }
            }
          }
        );
      }
    }
  );


  Promise.all(promises)
    .then(function (promise_returns) {
      console.log("inquiry total=" + promise_returns[0]);
      res.send({
        inquiry_total: promise_returns[0],
        last_MN_inquiry: promise_returns[1],
        total_enrollment: promise_returns[2],
        last_mn_enrollment: promise_returns[3],
        pending_followup: promise_returns[4],
        Today_followup: promise_returns[5],        
        user_pending: promise_returns[6],
        st_fa_pend: promise_returns[7],
        st_fa_pend: promise_returns[8],
        visa_fee_cnt: promise_returns[9],
      });
    })
    .catch((error) => {
      console.log(error);
    });

  //res.send({ data: inquiry_total });
  //    res.send("Data found");
});

module.exports = router;
