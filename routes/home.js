var express = require("express");
var router = express.Router();
const UserAuthenticate = require("./middleware/userAuthenticate");
const jwtAuthe = require("./middleware/jwtAuthenticate");
const conn = require("../db.js");

router.get("/", UserAuthenticate.method(), (req, res) => {
  res.send("home");
});

//router.get("/",jwtAuth,(req,res)=>{
router.get("/count", (req, res) => {
  let agentid = 1;

  var promises = [];

  //Get Total Inquiry
  inquiry_total = 0;
  var prom1 = new Promise(function (resolve, reject) {
    conn.query(
      "select count(candidateid) as inquiry_total from candidate where enrolled=0 and statusid in(0,1) and clid=" +
        agentid +
        "",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        inquiry_total = data[0].inquiry_total;
        resolve(inquiry_total);
      }
    );
  });
  promises.push(prom1);

  // Get Last month Inquiry
  let fd = "2000/01/01";
  let td = "2020/01/01";
  var last_MN_inquiry = 0;
  prom2 = new Promise(function (resolve, reject) {
    conn.query(
      "select count(candidateid) as inquiry from candidate where enrolled=0 and candidatedt between STR_TO_DATE('" +
        fd +
        "','%Y/%m/%d') and STR_TO_DATE('" +
        td +
        "','%Y/%m/%d') and clid=" +
        agentid +
        "",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        last_MN_inquiry = data[0].inquiry;
        resolve(last_MN_inquiry);
      }
    );
  });
  promises.push(prom2);

  // Get Total Enrollment
  var total_enrollment = 0;
  prom3 = new Promise(function (resolve, reject) {
    conn.query(
      "select count(candidateid) as total_enrollment from candidate where enrolled=1 and clid=" +
        agentid +
        "",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        total_enrollment = data[0].total_enrollment;
        resolve(total_enrollment);
      }
    );
  });
  promises.push(prom3);

  // Get Last Month Enrollment
  var last_mn_enrollment = 0;
  prom4 = new Promise(function (resolve, reject) {
    conn.query(
      "select count(candidateid) as last_mn_enrollment from candidate where enrolled=1 and candidatedt between STR_TO_DATE('" +
        fd +
        "','%Y/%m/%d') and STR_TO_DATE('" +
        td +
        "','%Y/%m/%d') and clid=" +
        agentid +
        "",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        last_mn_enrollment = data[0].last_mn_enrollment;
        resolve(last_mn_enrollment);
      }
    );
  });
  promises.push(prom4);

  // Get Pending Followup
  var pending_followup = 0;
  prom5 = new Promise(function (resolve, reject) {
    conn.query(
      "select candidateid from candidate where enrolled=0 and clid=" +
        agentid +
        " and statusid in(0,1)",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        let cnt = 0;
        for (var i = 0; i < data.length; i++) {
          var candid = data[i].candidateid;
          conn.query(
            "select count(candidateid) as no_of_followup from enrolfollow where candidateid=" +
              candid +
              "",
            (error1, data1) => {
              if (error1) {
                res.send(error);
              }
              let no_of_followup = data1[0].no_of_followup;

              if (no_of_followup < 6) {
                cnt = cnt + 1;
              }
            }
          );
        }
        pending_followup = cnt;
        resolve(pending_followup);
      }
    );
  });
  promises.push(prom5);

  // Get Today's Followup
  var Today_followup = 0;
  prom6 = new Promise(function (resolve, reject) {
    conn.query(
      "select candidateid from candidate where enrolled=0 and clid=" +
        agentid +
        " and statusid in(0,1)",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        let cnt = 0;
        let ts = Date.now();

        let date_ob = new Date(ts);
        let curdate =
          date_ob.getFullYear() +
          "/" +
          date_ob.getMonth() +
          "/" +
          date_ob.getDate();
        for (var i = 0; i < data.length; i++) {
          var candid = data[i].candidateid;
          conn.query(
            "select count(candidateid) as no_of_followup from enrolfollow where candidateid=" +
              candid +
              " and nextfollowup=STR_TO_DATE('" +
              curdate +
              "','%Y/%m/%d')",
            (error1, data1) => {
              if (error1) {
                return reject(error);
              }
              let no_of_followup = data1[0].no_of_followup;

              if (no_of_followup < 6) {
                cnt = cnt + 1;
              }
            }
          );
        }
        Today_followup = cnt;
        resolve(Today_followup);
      }
    );
  });
  promises.push(prom6);

  //University List Status
  var last_mn_enrollment = 0;
  let unv_finalising_pend = 0; // university list which is pending to be finalised
  prom7 = new Promise(function (resolve, reject) {
    let unv_cnt = 0; // university count
    let ul_ps_cand = 0; //university list pending to send to candidate
    let st_fa_pend = 0; //university list pending to send to final authority pending
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
          conn.query(
            "select count(universitylistid) as university_cnt from uniliststat where candidateid=" +
              candid +
              "",
            (error1, data1) => {
              if (error1) {
                return reject(error);
              }
              unv_cnt = data1[0].university_cnt;

              if (unv_cnt === 0) {
                unv_finalising_pend = unv_finalising_pend + 1;
                console.log("unv_finalising_pend" + unv_finalising_pend);
              }

              conn.query(
                "select count(universitylistid) as university_cnt from uniliststat where candidateid=" +
                  candid +
                  " and sendtocand=0",
                (error1, data1) => {
                  if (error1) {
                    return reject(error);
                  }
                  unv_cnt = data[0].university_cnt;

                  if (unv_cnt === 0) {
                    ul_ps_cand = ul_ps_cand + 1;
                  }
                }
              );

              conn.query(
                "select count(universitylistid) as university_cnt from uniliststat where candidateid=" +
                  candid +
                  " and sendtovaibhav=0",
                (error1, data1) => {
                  if (error1) {
                    return reject(error);
                  }
                  unv_cnt = data[0].university_cnt;

                  if (unv_cnt === 0) {
                    st_fa_pend = st_fa_pend + 1;
                  }
                }
              );
            }
          );
        }
        last_mn_enrollment = data[0].last_mn_enrollment;
        resolve(last_mn_enrollment);
      }
    );
  });
  promises.push(prom7);

  //Data for pending fees
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

  //Visa fees pending count
  var visa_fee_cnt = 0;
  prom10 = new Promise(function (resolve, reject) {
    conn.query(
      "select count(candvisaid) as visa_fee_cnt from candvisa where visafees=0 and candidateid in (select candidateid from candidate where enrolled=1 and clid=" +
        agentid +
        ")",
      (error, data) => {
        if (error) {
          return reject(error);
        }
        visa_fee_cnt = data[0].visa_fee_cnt;
        resolve(visa_fee_cnt);
      }
    );
  });
  promises.push(prom10);

  Promise.all(promises)
    .then(function () {
      console.log("inquiry total=" + inquiry_total);
      res.send({
        inquiry_total: inquiry_total,
        last_MN_inquiry: last_MN_inquiry,
        total_enrollment: total_enrollment,
        last_mn_enrollment: last_mn_enrollment,
        pending_followup: pending_followup,
        Today_followup: Today_followup,
        visa_fee_cnt: visa_fee_cnt,
        user_pending: unv_finalising_pend,
      });
    })
    .catch((error) => {
      console.log(error);
    });

  //res.send({ data: inquiry_total });
  //    res.send("Data found");
});

module.exports = router;
