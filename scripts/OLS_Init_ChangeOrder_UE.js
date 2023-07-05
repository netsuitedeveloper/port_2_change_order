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

define(["N/record", "N/log", "N/search", "N/ui/serverWidget"], function (
  record,
  log,
  search,
  serverWidget
) {
  function beforeLoad(context) {
    var strLoggerTitle = "OLS_Init_ChangeOrder_UE beforeLoad";
    log.debug({
      title: strLoggerTitle,
      details: "Started Successfully",
    });

    // log.debug({
    //     title: "context",
    //     details: JSON.stringify(context)
    // });

    // set Change Order's default fields "Total" (body field), "Amount", "Account" (line item fields) as hidden
    context.form.getField("total").updateDisplayType({ displayType: "hidden" });
    context.form
      .getSublist("line")
      .getField("amount")
      .updateDisplayType({ displayType: "hidden" });
    context.form
      .getSublist("line")
      .getField("account")
      .updateDisplayType({ displayType: "hidden" });

    // Only allow selection of sales order that are designated to Project
    // after hidden "Sales Order" (custbody_ols_co_so) (main body field)
    // instead, insert a new select field "Sales Order" (custpage_co_so_designated) with designated sales orders list
    if (context.type != "view") {
      // only when this code is called by user action, not by script
      if (context.request && context.request.parameters) {
        // get following values from url
        // project : Project ID
        var projectID = context.request.parameters.project;

        if (!projectID || projectID == "") {
          // if current Change Order has already set with 'Project', use that as project id for filtering
          var coProjectID = context.newRecord.getValue({
            fieldId: "custbody_ols_co_project",
          });
          if (coProjectID) {
            log.debug({
              title: "Existing CO Project ID",
              details: coProjectID,
            });
            projectID = coProjectID;
          }
        }

        if (projectID) {
          var coSOID = context.newRecord.getValue({
            fieldId: "custbody_ols_co_so",
          });
          context.form
            .getField("custbody_ols_co_so")
            .updateDisplayType({ displayType: "hidden" });

          var selectSO = context.form.addField({
            id: "custpage_co_so_designated",
            type: serverWidget.FieldType.SELECT,
            label: "Sales Order",
          });
          selectSO.isMandatory = true;
          selectSO.addSelectOption({
            value: "",
            text: "",
          });

          // Create Search for "Approved Change Orders"
          var searchFilters = [];
          searchFilters.push(
            search.createFilter({
              name: "type",
              operator: search.Operator.ANYOF,
              values: ["SalesOrd"],
            })
          );
          searchFilters.push(
            search.createFilter({
              name: "mainline",
              operator: search.Operator.IS,
              values: ["T"],
            })
          );
          searchFilters.push(
            search.createFilter({
              name: "internalidnumber",
              join: "jobmain",
              operator: search.Operator.EQUALTO,
              values: projectID,
            })
          );

          var searchColumns = [];
          searchColumns.push(
            search.createColumn({
              name: "tranid",
              label: "Sales Order Number",
              sort: search.Sort.ASC,
            })
          );

          var srch_designatedSOList = search.create({
            type: search.Type.SALES_ORDER,
            filters: searchFilters,
            columns: searchColumns,
          });

          // Add Search results to each select option
          srch_designatedSOList.run().each(function (result) {
            var soID = result.id;
            var soTranid = result.getValue("tranid");
            var soDocNumber = "Sales Order #" + soTranid.toString();

            if (soID == coSOID) {
              selectSO.addSelectOption({
                value: soID,
                text: soDocNumber,
                isSelected: true,
              });
            } else {
              selectSO.addSelectOption({
                value: soID,
                text: soDocNumber,
              });
            }

            return true;
          });

          context.form.insertField({
            field: selectSO,
            nextfield: "custbody_ols_co_loadcheck",
          });
        }
      }
    }

    // initiate the following fields from Project record information when script is trigged from Project record
    // "Customer"
    // "Project"
    if (context.type == "create") {
      // only when this code is called by user action, not by script
      if (context.request && context.request.parameters) {
        // get following values from url
        // project : Project ID
        var projectID = context.request.parameters.project;

        if (projectID) {
          var projectRec = record.load({
            type: "job",
            id: projectID,
          });
          var projectCust = projectRec.getValue({
            fieldId: "customer",
          });
          context.newRecord.setValue({
            fieldId: "custbody_ols_co_project",
            value: projectID,
          });
          context.newRecord.setValue({
            fieldId: "custbody_ols_co_customer",
            value: projectCust,
          });
        }
      }
    }
    // remove "Edit" button for "Approved" Change Orders
    else if (context.type == "view") {
      // var coStatus = context.newRecord.getValue({fieldId:'status'});
      // if (coStatus == 'Approved'){
      //    context.form.removeButton('edit');
      // }
    }
    // disable following fields after Change Order is created
    // "CUSTOMER"
    // "PROJECT"
    // disable "Status" field for "Approved" Change Orders
    else if (context.type == "edit") {
      context.form
        .getField("custbody_ols_co_customer")
        .updateDisplayType({ displayType: "disabled" });
      context.form
        .getField("custbody_ols_co_project")
        .updateDisplayType({ displayType: "disabled" });

      var coStatus = context.newRecord.getValue({ fieldId: "status" });
      if (coStatus == "Approved") {
        context.form
          .getField("transtatus")
          .updateDisplayType({ displayType: "disabled" });
      }
    }

    log.debug({
      title: strLoggerTitle,
      details: "Ended Successfully",
    });
  }

  function beforeSubmit(context) {
    var strLoggerTitle = "OLS_Init_ChangeOrder_UE beforeSubmit";
    log.debug({
      title: strLoggerTitle,
      details: "Started Successfully",
    });

    // Only allow selection of sales order that are designated to Project
    // get selected sales order of designated list (custpage_co_so_designated)
    // and apply it to "Sales Order" (custbody_ols_co_so) (main body field)
    if (context.type != "view") {
      var newSOID = context.newRecord.getValue({
        fieldId: "custpage_co_so_designated",
      });
      if (!newSOID) {
        log.debug({
          title: "newSOID",
          details: "sales order is not selected from designated list",
        });
      } else {
        context.newRecord.setValue({
          fieldId: "custbody_ols_co_so",
          value: newSOID,
        });
      }
    }

    // before submit on create, load project record and get "Change Order Number" (Hidden), calculate new "Change Order Number"
    // update project's field "Change Order Number" and set current Change Order's field "Change Order Number"
    if (context.type == "create") {
      var projectID = context.newRecord.getValue({
        fieldId: "custbody_ols_co_project",
      });

      var projectRec = record.load({
        type: "job",
        id: projectID,
      });

      var projectCONumber = projectRec.getValue({
        fieldId: "custentity_ols_project_co_number",
      });
      if (projectCONumber) {
        projectCONumber += 1;
      } else {
        projectCONumber = 1;
      }
      projectRec.setValue({
        fieldId: "custentity_ols_project_co_number",
        value: projectCONumber,
      });

      projectRec.save();

      var coNumber = "CO# " + projectCONumber.toString();

      context.newRecord.setValue({
        fieldId: "custbody_ols_co_number",
        value: coNumber,
      });
    }
    // before submit on edit, if it was Approved & Loaded Change Order, update items at the related Sales Order
    // When saving an edited Change Order,
    // 1  if "Sales Order" is changed, remove prior SO's line items related with CO and insert all CO line items into new SO
    // 2  if "Sales Order" is not changed, only changed line items ( i.e. remove existing line item & add new line item ),
    //      1) find the related SO's line items and compare them with CO's items ( only with "Loaded" is checked),
    //           - if SO's item (related with CO) is not found among "Loaded" items of CO, then remove it from SO
    //           - if the SO's item is found among "Loaded" items of CO, then update it within SO
    //      2) also for not "Loaded" items of CO ( it means newly created ), insert them into the related SO
    else if (context.type == "edit") {
      // log.debug({
      //     title:'Edit',
      //     details: JSON.stringify(context)
      // });

      log.debug({
        title: "Edit Old Record",
        details: JSON.stringify(context.oldRecord),
      });

      var coRecNew = context.newRecord;
      var coID = coRecNew.id;

      var coCheckLoaded = coRecNew.getValue({
        fieldId: "custbody_ols_co_loadcheck",
      });

      if (coCheckLoaded) {
        var coRecOld = context.oldRecord;
        var coOldSO = coRecOld.getValue({
          fieldId: "custbody_ols_co_so",
        });

        var coNewSO = coRecNew.getValue({
          fieldId: "custbody_ols_co_so",
        });

        if (coNewSO != coOldSO) {
          // remove sales order items related with old change order
          var soRecOld = record.load({
            type: "salesorder",
            id: coOldSO,
            isDynamic: true,
          });

          var soOldItemCount = soRecOld.getLineCount({ sublistId: "item" });

          for (
            var soOldlineNum = soOldItemCount - 1;
            soOldlineNum >= 0;
            soOldlineNum--
          ) {
            var soItemCO = soRecOld.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_ols_so_item_co",
              line: soOldlineNum,
            });

            if (soItemCO == coID) {
              soRecOld.removeLine({
                sublistId: "item",
                line: soOldlineNum,
              });
            }
          }

          soRecOld.save();

          // insert sales order items related with new change order
          var soRecNew = record.load({
            type: "salesorder",
            id: coNewSO,
            isDynamic: true,
          });

          var soNewItemCount = soRecNew.getLineCount({ sublistId: "item" });
          var coItemCount = coRecNew.getLineCount({ sublistId: "line" });

          for (var coLineNum = 0; coLineNum < coItemCount; coLineNum++) {
            var coItemID = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_internalid",
              line: coLineNum,
            });
            var coItemUnit = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_unit",
              line: coLineNum,
            });
            var coItemQty = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_quantity",
              line: coLineNum,
            });
            var coItemDesk = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_description",
              line: coLineNum,
            });
            var coItemRate = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_unitsell",
              line: coLineNum,
            });
            var coItemAmount = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_amount",
              line: coLineNum,
            });
            // if (coItemAmount < 0) coItemAmount = coItemAmount * -1;

            soRecNew.selectNewLine({ sublistId: "item" });

            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_ols_so_item_co",
              value: coID,
            });
            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "item",
              value: coItemID,
            });
            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "custcol_ols_co_item_unit",
              value: coItemUnit,
            });
            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "quantity",
              value: coItemQty,
            });
            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "description",
              value: coItemDesk,
            });
            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "rate",
              value: coItemRate,
            });
            soRecNew.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "amount",
              value: coItemAmount,
            });

            soRecNew.commitLine({ sublistId: "item" });
          }

          soRecNew.save();

          // get item 'id' from updated sales order, set them to change order line item
          var soUpdatedRec = record.load({
            type: "salesorder",
            id: coNewSO,
            isDynamic: true,
          });

          for (var coLineNum = 0; coLineNum < coItemCount; coLineNum++) {
            var soItemSpecID = soUpdatedRec.getSublistValue({
              sublistId: "item",
              fieldId: "id",
              line: soNewItemCount + coLineNum,
            });
            // log.debug({
            //     title:'Updated SO Item Specific ID',
            //     details: soItemSpecID
            // });

            coRecNew.setSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_loaded",
              line: coLineNum,
              value: true,
            });
            coRecNew.setSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_so_itemid",
              line: coLineNum,
              value: soItemSpecID,
            });
          }
        } else {
          // insert change order not "Loaded" items into sales order
          var soRecOld = record.load({
            type: "salesorder",
            id: coNewSO,
            isDynamic: true,
          });

          var soOldItemCount = soRecOld.getLineCount({ sublistId: "item" });
          var coItemCount = coRecNew.getLineCount({ sublistId: "line" });

          for (var coLineNum = 0; coLineNum < coItemCount; coLineNum++) {
            var coItemLoaded = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_loaded",
              line: coLineNum,
            });

            if (!coItemLoaded) {
              var coItemID = coRecNew.getSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_internalid",
                line: coLineNum,
              });
              var coItemUnit = coRecNew.getSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_unit",
                line: coLineNum,
              });
              var coItemQty = coRecNew.getSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_quantity",
                line: coLineNum,
              });
              var coItemDesk = coRecNew.getSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_description",
                line: coLineNum,
              });
              var coItemRate = coRecNew.getSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_unitsell",
                line: coLineNum,
              });
              var coItemAmount = coRecNew.getSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_amount",
                line: coLineNum,
              });
              // if (coItemAmount < 0) coItemAmount = coItemAmount * -1;

              soRecOld.selectNewLine({ sublistId: "item" });

              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_ols_so_item_co",
                value: coID,
              });
              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "item",
                value: coItemID,
              });
              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "custcol_ols_co_item_unit",
                value: coItemUnit,
              });
              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "quantity",
                value: coItemQty,
              });
              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "description",
                value: coItemDesk,
              });
              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "rate",
                value: coItemRate,
              });
              soRecOld.setCurrentSublistValue({
                sublistId: "item",
                fieldId: "amount",
                value: coItemAmount,
              });

              soRecOld.commitLine({ sublistId: "item" });
            }
          }

          soRecOld.save();

          // get item 'id' from new sales order, set them to change order line item
          var soNewRec = record.load({
            type: "salesorder",
            id: coNewSO,
            isDynamic: true,
          });

          var coUnloadedItemCount = 0;

          for (var coLineNum = 0; coLineNum < coItemCount; coLineNum++) {
            var coItemLoaded = coRecNew.getSublistValue({
              sublistId: "line",
              fieldId: "custcol_ols_co_item_loaded",
              line: coLineNum,
            });

            if (!coItemLoaded) {
              var soItemSpecID = soNewRec.getSublistValue({
                sublistId: "item",
                fieldId: "id",
                line: soOldItemCount + coUnloadedItemCount,
              });
              // log.debug({
              //     title: 'CO Line ' + coLineNum,
              //     details: 'New SO Item Specific ID ' + soItemSpecID
              // });

              coRecNew.setSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_loaded",
                line: coLineNum,
                value: true,
              });
              coRecNew.setSublistValue({
                sublistId: "line",
                fieldId: "custcol_ols_co_item_so_itemid",
                line: coLineNum,
                value: soItemSpecID,
              });

              coUnloadedItemCount++;
            }
          }

          // for only old sales order items with related at change order, update or delete it based on new change order line items
          for (
            var soLineNum = soOldItemCount - 1;
            soLineNum >= 0;
            soLineNum--
          ) {
            var soItemCO = soNewRec.getSublistValue({
              sublistId: "item",
              fieldId: "custcol_ols_so_item_co",
              line: soLineNum,
            });

            if (soItemCO == coID) {
              var coItemExitingCheck = false;

              var soItemSpecID = soNewRec.getSublistValue({
                sublistId: "item",
                fieldId: "id",
                line: soLineNum,
              });

              for (var coLineNum = 0; coLineNum < coItemCount; coLineNum++) {
                var coItemSpecID = coRecNew.getSublistValue({
                  sublistId: "line",
                  fieldId: "custcol_ols_co_item_so_itemid",
                  line: coLineNum,
                });

                // if sales order item exists in change order, update it with new data
                if (soItemSpecID == coItemSpecID) {
                  // log.debug({
                  //     title: 'SO Item Line' + soLineNum + ', Spec ID: ' + soItemSpecID,
                  //     details: 'Found CO Line ' + coLineNum
                  // });

                  var coItemID = coRecNew.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_ols_co_item_internalid",
                    line: coLineNum,
                  });
                  var coItemUnit = coRecNew.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_ols_co_item_unit",
                    line: coLineNum,
                  });
                  var coItemQty = coRecNew.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_ols_co_item_quantity",
                    line: coLineNum,
                  });
                  var coItemDesk = coRecNew.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_ols_co_item_description",
                    line: coLineNum,
                  });
                  var coItemRate = coRecNew.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_ols_co_item_unitsell",
                    line: coLineNum,
                  });
                  var coItemAmount = coRecNew.getSublistValue({
                    sublistId: "line",
                    fieldId: "custcol_ols_co_item_amount",
                    line: coLineNum,
                  });
                  // if (coItemAmount < 0) coItemAmount = coItemAmount * -1;

                  soNewRec.selectLine({ sublistId: "item", line: soLineNum });

                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ols_so_item_co",
                    value: coID,
                  });
                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    value: coItemID,
                  });
                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "custcol_ols_co_item_unit",
                    value: coItemUnit,
                  });
                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "quantity",
                    value: coItemQty,
                  });
                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "description",
                    value: coItemDesk,
                  });
                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "rate",
                    value: coItemRate,
                  });
                  soNewRec.setCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "amount",
                    value: coItemAmount,
                  });

                  soNewRec.commitLine({ sublistId: "item" });

                  coItemExitingCheck = true;
                  break;
                }
              }

              // if sales order item doesn't exist in change order, delete it
              if (!coItemExitingCheck) {
                // log.debug({
                //     title: 'SO Item Line' + soLineNum + ', Spec ID: ' + soItemSpecID,
                //     details: 'Deleted CO Line Spec ID'
                // });
                soNewRec.removeLine({
                  sublistId: "item",
                  line: soLineNum,
                });
              }
            }
          }

          soNewRec.save();
        }
      }
    }
    // before submit on delete, if it was Approved & Loaded Change Order, remove items at the related Sales Order
    else if (context.type == "delete") {
      // log.debug({
      //     title:'Delete',
      //     details: JSON.stringify(context)
      // });

      var coCheckLoaded = context.newRecord.getValue({
        fieldId: "custbody_ols_co_loadcheck",
      });

      if (coCheckLoaded) {
        var coID = context.newRecord.id;
        var coSOID = context.newRecord.getValue({
          fieldId: "custbody_ols_co_so",
        });

        var soRec = record.load({
          type: "salesorder",
          id: coSOID,
        });

        var soItemCount = soRec.getLineCount({ sublistId: "item" });

        for (var lineNum = soItemCount - 1; lineNum >= 0; lineNum--) {
          var soItemCO = soRec.getSublistValue({
            sublistId: "item",
            fieldId: "custcol_ols_so_item_co",
            line: lineNum,
          });

          if (soItemCO == coID) {
            // log.debug({
            //     title:'Line Number',
            //     details: lineNum
            // });
            soRec.removeLine({
              sublistId: "item",
              line: lineNum,
            });
          }
        }

        soRec.save();
      }
    }

    log.debug({
      title: strLoggerTitle,
      details: "Ended Successfully",
    });
  }

  function afterSubmit(context) {
    var strLoggerTitle = "OLS_Init_ChangeOrder_UE afterSubmit";
    log.debug({
      title: strLoggerTitle,
      details: "Started Successfully",
    });

    // When there's a update with 'Status', 'Load Check', 'Total Amount', update the following Project financial fields
    // Original Contract Total
    // Approved Change Order Total
    // Current Contract Total
    // Unloaded Change Order Total
    // Pending Change Order Total
    if (
      context.type != "create" &&
      context.newRecord.getValue({ fieldId: "transtatus" }) ==
        context.oldRecord.getValue({ fieldId: "transtatus" }) &&
      context.newRecord.getValue({ fieldId: "custbody_ols_co_loadcheck" }) ==
        context.oldRecord.getValue({ fieldId: "custbody_ols_co_loadcheck" }) &&
      context.newRecord.getValue({ fieldId: "custbody_ols_co_totalamount" }) ==
        context.oldRecord.getValue({ fieldId: "custbody_ols_co_totalamount" })
    ) {
      log.debug({
        title: "not create type",
        details: "status|loadcheck|amount did not changed",
      });
      return true;
    }
    // var coNewTranstatus = context.newRecord.getValue({fieldId:'transtatus'});
    // var coOldTranstatus = context.oldRecord.getValue({fieldId:'transtatus'});

    // var coNewLoadcheck = context.newRecord.getValue({fieldId:'custbody_ols_co_loadcheck'});
    // var coOldLoadcheck = context.oldRecord.getValue({fieldId:'custbody_ols_co_loadcheck'});

    // var coNewAmount = context.newRecord.getValue({fieldId:'total'});
    // var coOldAmount = context.oldRecord.getValue({fieldId:'total'});

    // if ( coNewTranstatus!=coOldTranstatus || coNewLoadcheck!=coOldLoadcheck || coNewAmount!=coOldAmount ){

    var oriContractTotal = 0;
    var curContractTotal = 0;
    var loadedCOTotal = 0;
    var unloadedCOTotal = 0;
    var pendingCOTotal = 0;

    var projectID = context.newRecord.getValue({
      fieldId: "custbody_ols_co_project",
    });
    var projectRec = record.load({
      type: "job",
      id: projectID,
    });

    // search to filter related sales orders with amount
    var searchFiltersSO = [];
    searchFiltersSO.push(
      search.createFilter({
        name: "type",
        operator: search.Operator.ANYOF,
        values: ["SalesOrd"],
      })
    );
    searchFiltersSO.push(
      search.createFilter({
        name: "mainline",
        operator: search.Operator.IS,
        values: ["T"],
      })
    );
    searchFiltersSO.push(
      search.createFilter({
        name: "internalidnumber",
        join: "jobmain",
        operator: search.Operator.EQUALTO,
        values: projectID,
      })
    );

    var searchColumnsSO = [];
    searchColumnsSO.push(
      search.createColumn({ name: "total", label: "Sales Order Total" })
    );

    var srch_SOList = search.create({
      type: search.Type.SALES_ORDER,
      filters: searchFiltersSO,
      columns: searchColumnsSO,
    });

    srch_SOList.run().each(function (result) {
      // log.debug({
      //     title:'Sales Order',
      //     details: JSON.stringify(result)
      // });

      var soTotal = parseFloat(result.getValue("total"));
      curContractTotal = curContractTotal + soTotal;

      return true;
    });

    // search to filter related change orders with amount, status, loaded
    var searchFiltersCO = [];
    searchFiltersCO.push(
      search.createFilter({
        name: "type",
        operator: search.Operator.ANYOF,
        values: ["Custom111"],
      })
    );
    searchFiltersCO.push(
      search.createFilter({
        name: "mainline",
        operator: search.Operator.IS,
        values: ["T"],
      })
    );
    searchFiltersCO.push(
      search.createFilter({
        name: "custbody_ols_co_project",
        operator: search.Operator.ANYOF,
        values: projectID,
      })
    );
    searchFiltersCO.push(
      search.createFilter({
        name: "status",
        operator: search.Operator.NONEOF,
        values: ["Custom111:C"],
      })
    );

    var searchColumnsCO = [];
    searchColumnsCO.push(
      search.createColumn({
        name: "custbody_ols_co_totalamount",
        label: "Amount",
      })
    );
    searchColumnsCO.push(
      search.createColumn({ name: "status", label: "Status" })
    );
    searchColumnsCO.push(
      search.createColumn({
        name: "custbody_ols_co_loadcheck",
        label: "Loaded",
      })
    );

    var srch_COList = search.create({
      type: "customtransaction_ols_changeorder",
      filters: searchFiltersCO,
      columns: searchColumnsCO,
    });

    srch_COList.run().each(function (result) {
      // log.debug({
      //     title:'Change Order',
      //     details: JSON.stringify(result)
      // });

      var coTotal = parseFloat(result.getValue("custbody_ols_co_totalamount"));
      var coStatus = result.getText("status");
      var coLoaded = result.getValue("custbody_ols_co_loadcheck");
      // log.debug({
      //     title:'coTotal',
      //     details: coTotal
      // });
      // log.debug({
      //     title:'coStatus',
      //     details: coStatus
      // });
      // log.debug({
      //     title:'coLoaded',
      //     details: coLoaded
      // });

      if (coStatus == "Approved") {
        if (coLoaded) {
          loadedCOTotal = loadedCOTotal + coTotal;
        } else {
          unloadedCOTotal = unloadedCOTotal + coTotal;
        }
      } else if (coStatus == "Pending Approval") {
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
      fieldId: "custentity_ols_pro_orig_contract_total",
      value: oriContractTotal,
      ignoreFieldChange: true,
    });
    projectRec.setValue({
      fieldId: "custentity_ols_pro_loaded_co_total",
      value: loadedCOTotal,
      ignoreFieldChange: true,
    });
    projectRec.setValue({
      fieldId: "custentity_ols_pro_cur_contract_total",
      value: curContractTotal,
      ignoreFieldChange: true,
    });
    projectRec.setValue({
      fieldId: "custentity_ols_pro_unloaded_co_total",
      value: unloadedCOTotal,
      ignoreFieldChange: true,
    });
    projectRec.setValue({
      fieldId: "custentity_ols_pro_pending_co_total",
      value: pendingCOTotal,
      ignoreFieldChange: true,
    });

    projectRec.save();
    // }

    log.debug({
      title: strLoggerTitle,
      details: "Ended Successfully",
    });
  }
  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
