// 
// Copyright (c) 2019 OrangeLight Solutions, LLC 
// 1050 N Stuart Street 325 Arlington, VA 22201
// www.orangelightsolutions.com 
// All Rights Reserved. 
//  
// @author  OrangeLight Solutions
// @version 4.0
// @date    12 Jul 2019
//


/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define([ 'N/record', 'N/log', 'N/search', 'N/ui/serverWidget' ],
function(record, log, search, serverWidget) {

    function afterSubmit(context){
 
        var strLoggerTitle = 'OLS_Init_ChangeOrder_UE afterSubmit';
        log.debug({
            title: strLoggerTitle,
            details: 'Started Successfully'
        });

        // When there's a update with 'Total Amount', update the following Project financial fields
        // Original Contract Total
        // Approved Change Order Total
        // Current Contract Total
        // Unloaded Change Order Total
        // Pending Change Order Total
		// var soNewTotal = context.newRecord.getValue({fieldId:'total'});
		// var soOldTotal = context.oldRecord.getValue({fieldId:'total'});

        if(context.type != 'create' 
        && context.newRecord.getValue({fieldId:'total'}) == context.oldRecord.getValue({fieldId:'total'})
        ){
            log.debug({
                title: "not create type",
                details: 'status|loadcheck|amount did not changed'
            });
            return true;
        }

        // if ( soNewTotal!=soOldTotal ){

        if(!context.newRecord.getValue({fieldId:'job'})){
            log.debug({
                title: "project is empty",
                details: 'status|loadcheck|amount could not be changed'
            });
            return true;
        }

		var oriContractTotal = 0;
		var curContractTotal = 0;
		var loadedCOTotal = 0;
		var unloadedCOTotal = 0;
		var pendingCOTotal = 0;

		var projectID = context.newRecord.getValue({fieldId:'job'});
		var projectRec = record.load({
			type: 'job',
			id: projectID
		});

		// search to filter related sales orders with amount
        var searchFiltersSO = [];
        searchFiltersSO.push( search.createFilter({name: 'type', operator: search.Operator.ANYOF, values: ["SalesOrd"]}));
        searchFiltersSO.push( search.createFilter({name: 'mainline', operator: search.Operator.IS, values: ["T"]}));
        searchFiltersSO.push( search.createFilter({name: 'internalidnumber', join:"jobmain" , operator: search.Operator.EQUALTO, values: projectID}));

        var searchColumnsSO = [];
        searchColumnsSO.push( search.createColumn({name: 'total', label: 'Sales Order Total'}));

        var srch_SOList = search.create({
            type: search.Type.SALES_ORDER,
            filters: searchFiltersSO,
            columns: searchColumnsSO
        });

        srch_SOList.run().each(function(result){

            // log.debug({
            //     title:'Sales Order',
            //     details: JSON.stringify(result)
            // });

			var soTotal = parseFloat(result.getValue('total'));
			curContractTotal = curContractTotal + soTotal;

            return true;
        });

		// search to filter related change orders with amount, status, loaded
        var searchFiltersCO = [];
        searchFiltersCO.push( search.createFilter({name: 'type', operator: search.Operator.ANYOF, values: ["Custom111"]}));
        searchFiltersCO.push( search.createFilter({name: 'mainline', operator: search.Operator.IS, values: ["T"]}));
        searchFiltersCO.push( search.createFilter({name: 'custbody_ols_co_project', operator: search.Operator.ANYOF, values: projectID}));
        searchFiltersCO.push( search.createFilter({name: 'status', operator: search.Operator.NONEOF, values: ["Custom111:C"]}));

        var searchColumnsCO = [];
        searchColumnsCO.push( search.createColumn({name: 'custbody_ols_co_totalamount', label: 'Amount'}));
        searchColumnsCO.push( search.createColumn({name: 'status', label: 'Status'}));
        searchColumnsCO.push( search.createColumn({name: 'custbody_ols_co_loadcheck', label : 'Loaded'}));

        var srch_COList = search.create({
            type: "customtransaction_ols_changeorder",
            filters: searchFiltersCO,
            columns: searchColumnsCO
        });

        srch_COList.run().each(function(result){

            // log.debug({
            //     title:'Change Order',
            //     details: JSON.stringify(result)
            // });
            
            var coTotal = parseFloat(result.getValue('custbody_ols_co_totalamount'));
            var coStatus = result.getText('status');
            var coLoaded = result.getValue('custbody_ols_co_loadcheck');

            if ( coStatus == "Approved"){
            	if (coLoaded){
					loadedCOTotal = loadedCOTotal + coTotal;
            	} else {
					unloadedCOTotal = unloadedCOTotal + coTotal;
            	}
            } else if ( coStatus == "Pending Approval"){
				pendingCOTotal = pendingCOTotal + coTotal;
            } else {
                // log.debug({
                //     title:'Unexpected Change Order',
                //     details: JSON.stringify(result)
                // });
            }

            return true;
        });

		oriContractTotal = (curContractTotal - loadedCOTotal).toFixed(2);

        // log.debug({
        //     title:'Original Contract Total',
        //     details: oriContractTotal
        // });
        // log.debug({
        //     title:'Current Contract Total',
        //     details: curContractTotal
        // });
        // log.debug({
        //     title:'Approved Change Order Total',
        //     details: loadedCOTotal
        // });
        // log.debug({
        //     title:'Unloaded Change Order Total',
        //     details: unloadedCOTotal
        // });
        // log.debug({
        //     title:'Pending Change Order Total',
        //     details: pendingCOTotal
        // });

        // set field values to project record
		projectRec.setValue({
			fieldId: 'custentity_ols_pro_orig_contract_total',
			value: oriContractTotal,
			ignoreFieldChange: true
		});
		projectRec.setValue({
			fieldId: 'custentity_ols_pro_loaded_co_total',
			value: loadedCOTotal,
			ignoreFieldChange: true
		});
		projectRec.setValue({
			fieldId: 'custentity_ols_pro_cur_contract_total',
			value: curContractTotal,
			ignoreFieldChange: true
		});
		projectRec.setValue({
			fieldId: 'custentity_ols_pro_unloaded_co_total',
			value: unloadedCOTotal,
			ignoreFieldChange: true
		});
		projectRec.setValue({
			fieldId: 'custentity_ols_pro_pending_co_total',
			value: pendingCOTotal,
			ignoreFieldChange: true
		});

		projectRec.save();
		// }

        log.debug({
            title: strLoggerTitle,
            details: 'Ended Successfully'
        });

    }
    return {
        afterSubmit : afterSubmit
    };

});