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
const ACATSection          = require('../models/ACATSection');
const CropACAT          = require('../models/ACAT');
const CostList          = require('../models/costList');
const CostListItem          = require('../models/costListItem');
const GroupedList          = require('../models/groupedList');

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

exports.aggregateAchieved = function* aggregateAchieved(next){
    //Get All client ACATs
    let clientACATs = yield ClientACAT.find({client: "5bbdfe638a878c00014d4ca8"}).exec();
    let m=0;

    

    for (i = 0; i < clientACATs.length; i++){
        let totalACATAppCost = 0;
        let totalACATAppRevenue = 0;
        let ACATs = clientACATs[i].ACATs; m++;
        if (ACATs.length){
            for (j = 0; j < ACATs.length; j++){
                let cropACAT = yield CropACAT.findOne({_id: ACATs[j]._id}).exec()
                let sections = cropACAT.sections;
                let costSection = yield ACATSection.findOne({_id: sections[0]}).exec();
                let inputSection = yield ACATSection.findOne({_id: costSection.sub_sections[0]}).exec();
                    let seedSection = yield ACATSection.findOne({_id:inputSection.sub_sections[0]}).exec();
                    let fertilizersSection = yield ACATSection.findOne({_id:inputSection.sub_sections[1]}).exec();
                    let chemicalSection = yield ACATSection.findOne({_id:inputSection.sub_sections[2]}).exec();
                let labourCostSection = yield ACATSection.findOne({_id: costSection.sub_sections[1]}).exec();
                let otherCostSection = yield ACATSection.findOne({_id: costSection.sub_sections[2]}).exec();

                let revenueSection = yield ACATSection.findOne({_id: sections[1]}).exec();
                let probableSection = yield ACATSection.findOne({_id: revenueSection.sub_sections[0]}).exec();

                //Do it turn by turn for cost first
                //1. Seed
                yield updateSection(seedSection);
                yield updateSection(fertilizersSection);
                yield updateSection(chemicalSection); 
                yield updateSection(inputSection);
                yield updateSection(labourCostSection);
                yield updateSection(otherCostSection);
                let total = yield updateSection(costSection);

                yield CropACAT.findOneAndUpdate({_id: ACATs[j]._id},
                    {$set:{"achieved.total_cost":  total,
                            "achieved.total_revenue": revenueSection.achieved_revenue},
                            "achieved.net_income": revenueSection.achieved_revenue - total}).exec();

                totalACATAppCost += total;
                totalACATAppRevenue += revenueSection.achieved_revenue;
            }           

        }
        yield ClientACAT.findOneAndUpdate({_id: clientACATs[i]._id},
            {$set:{"achieved.total_cost":  totalACATAppCost,
                    "achieved.total_revenue": totalACATAppRevenue,
                    "achieved.net_income": totalACATAppRevenue -  totalACATAppCost}})
    }

    this.body = m

}

function* updateSection(section){
    let total = yield computeAchievedSubTot(section);
    yield ACATSection.findOneAndUpdate({_id: section._id}, {$set:{achieved_sub_total: total}}).exec();
    return total;
}

function* computeAchievedSubTot (section){
    let value = 0;
    if (section.sub_sections.length){
        for (i = 0; i < section.sub_sections.length; i++){
            let innerSection = yield ACATSection.findOne({_id: section.sub_sections[i]}).exec();
            value += innerSection.achieved_sub_total
        }
    }
    else if (section.cost_list){
        let costList = yield CostList.findOne({_id: section.cost_list}).exec();
        if (costList.linear.length){
            for (i = 0; i < costList.linear.length; i++){
                let costListItem =  yield CostListItem.findOne({_id: costList.linear[i]}).exec();
                value += costListItem.achieved.total_price
            }
        }
        else if (costList.grouped.length){
            for (i = 0; i < costList.grouped.length; i++){
                
                let groupedList = yield GroupedList.findOne({_id: costList.grouped[i]}).exec();
                if (groupedList){
                    if (groupedList.items.length){
                        for (j = 0; j < groupedList.items; j++){
                            let costListItem = yield CostListItem.findOne({_id: groupedList.items[j]}).exec();
                            value += costListItem.achieved.total_price
                        }
                    }
                }
            }
        }
    }

    return value;

}