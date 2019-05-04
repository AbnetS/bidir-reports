const Account            = require('../models/account');
const Question           = require('../models/question');
const Client               = require('../models/client');
const Branch             = require('../models/branch');
const Section            = require('../models/section');
const History            = require('../models/history');
const Crop               = require('../models/crop');
const ACAT               = require('../models/ACAT');
const ClientACAT         = require('../models/clientACAT');
const LoanProposal       = require('../models/loanProposal');
const Screening          = require('../models/screening');

exports.update = function* updateLoanRequested(next){

    var client = "";
    var branch = "";
    let screening =  null;
    let question = null; 
    let answer = "";
    let loanCycles = [];
    let acat = null;
    let loanProposal = null;
    let n = 0;

    let response = [];

    let clients = yield Client.find({}).exec();
    for (i = 0; i < clients.length; i++)
    {
        var id = "";
        //Get the loan history
        loanCycles = yield History.find({client: clients[i]._id}).exec();
        if (loanCycles.length){
            for (var j = 0;j < loanCycles[0].cycles.length; j++){
                //Get the screening
                screening = yield Screening.findOne({_id: loanCycles[0].cycles[j].screening}).exec();
                if (screening._id){
                    question = yield Question.findOne({_id: screening.questions[18]}).exec();
                    answer = question.values[0];
                    var obj = {"question": question, "answer": answer};
                    response.push(obj)
                    if (loanCycles[0].cycles[j].acat){
                        acat = yield ClientACAT.findOne({_id: loanCycles[0].cycles[j].acat}).exec();
                        if (acat._id){
                            if (!isNaN(answer)){
                                loanProposal = yield LoanProposal.findOneAndUpdate({client_acat: acat._id},
                                    {$set: {loan_requested: answer}});
                                n++; }
                        }

                    }
                }
            
                
            }
        }
        
        
        
    
    
    }

    this.body = n;
    
    
    
    
}