sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    "sap/ui/Device",
    "sap/ui/table/library",
    "sap/m/TablePersoController",
    'sap/m/MessageToast',
	'sap/m/SearchField'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, TablePersoController, MessageToast, SearchField) {
        "use strict";

        var _this;
        var _oCaption = {};
        var _aPickDtl = [];
        var _aPickDtlTo = [];

        return BaseController.extend("zuiodfty.controller.Picking", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();
                this._router.getRoute("RoutePicking").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvNo: oEvent.getParameter("arguments").dlvNo,
                    mvtType: oEvent.getParameter("arguments").mvtType,
                    plantCd: "",
                    matNo: "",
                    batch: "",
                    sloc: "",
                    dlvItem: ""
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYPICKHDRMOD",
                    tblSrc: "ZDV_ODF_PCK_HDR",
                    tblId: "pickHdrTab",
                    tblModel: "pickHdr"
                });

                aTableList.push({
                    modCode: "ODFTYPICKDTLMOD",
                    tblSrc: "ZDV_ODF_PCK_DTL",
                    tblId: "pickDtlTab",
                    tblModel: "pickDtl"
                });

                _this.getColumns(aTableList);

                this._tableRendered = "";
                var oTableEventDelegate = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    },

                    onAfterRendering: function(oEvent) {
                        _this.onAfterTableRendering(oEvent);
                    }
                };

                this.byId("pickHdrTab").addEventDelegate(oTableEventDelegate);
                this.byId("pickDtlTab").addEventDelegate(oTableEventDelegate);
                
                _this.getView().setModel(new JSONModel({
                    results: []
                }), "pickHdr");

                _this.getView().setModel(new JSONModel({
                    results: []
                }), "pickDtl");

                _aPickDtl = [];
                _aPickDtlTo = [];
                
                _this.getPickHdr();

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                //console.log("onAfterTableRender", pTableId, pTableProps)
            },

            getPickHdr() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";
                
                oModel.read("/PickHeaderSet", {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("PickHeaderSet read", data);

                        data.results.forEach((item, idx) => {
                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        });

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "pickHdr");

                        _this.setRowReadMode("pickHdr");

                        var oTable = _this.byId("pickHdrTab");
                        if (oTable.getBinding("rows").aIndices.length > 0) {
                            var aIndices = oTable.getBinding("rows").aIndices;
                            var oData = _this.getView().getModel("pickHdr").getData().results[aIndices[0]];
                            _this.getView().getModel("ui").setProperty("/plantCd", oData.ISSPLANT);
                            _this.getView().getModel("ui").setProperty("/matNo", oData.ISSMATNO);
                            _this.getView().getModel("ui").setProperty("/batch", oData.ISSBATCH);
                            _this.getView().getModel("ui").setProperty("/sloc", oData.ISSSLOC);
                            _this.getView().getModel("ui").setProperty("/dlvItem", oData.DLVITEM);

                            _this.getPickDtl();
                        } else {
                            _this.getView().getModel("pickDtl").setProperty("/results", []);
                        }

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAutoPickHdr() {
                _this.showLoadingDialog("Loading...");

                var oTable = this.byId("pickHdrTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    _this.closeLoadingDialog();
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                var isAutoPick = false;
                aOrigSelIdx.forEach((item, idx) => {
                    var oDataHdr = _this.getView().getModel("pickHdr").getData().results[item];
                    var aPickDtl = jQuery.extend(true, [], _aPickDtl);
                    var aPickDtlFiltered = [];
                    aPickDtlFiltered.push(...aPickDtl.filter(x => x.PLANTCD == oDataHdr.ISSPLANT && 
                        x.MATNO == oDataHdr.ISSMATNO && x.BATCH == oDataHdr.ISSBATCH && x.SLOC == oDataHdr.ISSSLOC));

                    if (aPickDtlFiltered.length > 0) isAutoPick = true;
                    if (idx == aOrigSelIdx.length - 1) {
                        if (!isAutoPick) {
                            _this.closeLoadingDialog();
                            MessageBox.information(_oCaption.INFO_NO_ITEM_TO_PICK);
                            return;
                        }
                    }
                });

                aOrigSelIdx.forEach(itemIdx => {
                    var oDataHdr = _this.getView().getModel("pickHdr").getData().results[itemIdx];
                    var iBalHdr = parseFloat(oDataHdr.REQQTY);

                    var aPickDtl = jQuery.extend(true, [], _aPickDtl);
                    var aPickDtlFiltered = [];
                    aPickDtlFiltered.push(...aPickDtl.filter(x => x.PLANTCD == oDataHdr.ISSPLANT && 
                        x.MATNO == oDataHdr.ISSMATNO && x.BATCH == oDataHdr.ISSBATCH && x.SLOC == oDataHdr.ISSSLOC));

                    aPickDtlFiltered.forEach(item => {
                        // var iIdx = _aPickDtlTo.findIndex(x => x.huId == item.HUID && x.huItem == item.HUITEM);
                        // if (iIdx > -1) {
                        //     item.TOQTY = parseFloat(_aPickDtlTo[iIdx].toQty).toString();
                        // }

                        // item.BALANCE = (parseFloat(item.QTY) - parseFloat(item.TOQTY)).toString();

                        if (iBalHdr > 0) {
                            var iQty = (parseFloat(item.QTY) > iBalHdr ? (parseFloat(item.QTY) - iBalHdr) : 0);
                            var iToQty = parseFloat(item.QTY) - iQty;
                            var iBalDtl = parseFloat(item.QTY) - iToQty;

                            if (iToQty > 0) {
                                var iIdx = _aPickDtlTo.findIndex(x => x.dlvItem == oDataHdr.DLVITEM && 
                                    x.huId == item.HUID && x.huItem == item.HUITEM);

                                if (iIdx == -1) {
                                    _aPickDtlTo.push({
                                        dlvItem: oDataHdr.DLVITEM,
                                        huId: item.HUID,
                                        huItem: item.HUITEM,
                                        plantCd: item.PLANTCD,
                                        matNo: item.MATNO,
                                        batch: item.BATCH,
                                        sloc: item.SLOC,
                                        toQty: iToQty
                                    })
                                } else {
                                    _aPickDtlTo[iIdx].toQty = iToQty;
                                }
                            }
    
                            iBalHdr -= iToQty;
                        }
                    })

                    // Set Pick Qty Hdr
                    var aDataDtl = _aPickDtlTo.filter(x => x.plantCd == oDataHdr.ISSPLANT && 
                        x.matNo == oDataHdr.ISSMATNO && x.batch == oDataHdr.ISSBATCH && x.sloc == oDataHdr.ISSSLOC);

                    var iTotalToQty = 0.0;
                    aDataDtl.forEach(item => {
                        iTotalToQty += parseFloat(item.toQty);
                    });

                    // Set Header
                    _this.getView().getModel("pickHdr").setProperty("/results/" + itemIdx.toString() + "/PICKQTY", iTotalToQty.toString());
                    var iBalHdr = parseFloat(oDataHdr.REQQTY) - parseFloat(oDataHdr.ISSQTY) - iTotalToQty;
                    _this.getView().getModel("pickHdr").setProperty("/results/" + itemIdx.toString() + "/BALANCE", iBalHdr.toString());
                })

                _this.setPickDtl();

                _this.closeLoadingDialog();

                // _this.getView().getModel("pickDtl").getData().results.forEach((item, idx) => {
                //     if (iBalHdr > 0) {
                //         var iQty = (parseFloat(item.QTY) > iBalHdr ? (parseFloat(item.QTY) - iBalHdr) : 0);
                //         var iToQty = parseFloat(item.QTY) - iQty;
                //         var iBalDtl = parseFloat(item.QTY) - iToQty;

                //         _this.getView().getModel("pickDtl").setProperty("/results/" + idx.toString() + "/TOQTY", iToQty.toString());
                //         _this.getView().getModel("pickDtl").setProperty("/results/" + idx.toString() + "/BALANCE", iBalDtl).toString();

                //         iBalHdr -= iToQty;
                //     }
                // })

                // _this.setPickDtlTo();
            },

            onAddPickHdr() {
                if (_aPickDtlTo.length > 0) {
                    _this.showLoadingDialog("Loading...");

                    var oModel = this.getOwnerComponent().getModel();

                    _aPickDtlTo.forEach((item, idx) => {
                        var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => 
                                x.ISSPLANT == item.plantCd && x.ISSMATNO == item.matNo && 
                                x.ISSBATCH == item.batch && x.ISSSLOC == item.sloc
                            )[0];

                        var oDataDtl = _this.getView().getModel("pickDtl").getData().results.filter(x => 
                            x.HUID == item.huId && x.HUITEM == item.huItem
                        )[0];

                        var param = {
                            DLVNO: oDataHdr.DLVNO,
                            DLVITEM: oDataHdr.DLVITEM,
                            SEQNO: "",
                            PLANTCD: oDataHdr.ISSPLANT,
                            SLOC: oDataHdr.ISSSLOC,
                            MATNO: oDataHdr.ISSMATNO,
                            BATCH: oDataHdr.ISSBATCH,
                            PKGNO: oDataDtl.PKGNO,
                            HUID: oDataDtl.HUID,
                            HUITEM: oDataDtl.HUITEM,
                            DLVQTYORD: item.toQty,
                            ACTQTYORD: item.toQty,
                            DLVQTYBSE: item.toQty,
                            ACTQTYBSE: item.toQty,
                            BASEUOM: oDataDtl.UOM,
                            PKGGRSWT: oDataDtl.GROSSWT,
                            PKGNETWT: oDataDtl.NETWT,
                            WTUOM: oDataDtl.WEIGHTUOM,
                            LNDIM: oDataDtl.LENGTH,
                            WDDIM: oDataDtl.WIDTH,
                            DIMUOM: oDataDtl.DIMUOM,
                            BINCD: oDataDtl.BIN
                        }
                        
                        console.log("InfoHUTblSet param", param);
                        setTimeout(() => {
                            oModel.create("/InfoHUTblSet", param, {
                                method: "POST",
                                success: function(data, oResponse) {
                                    console.log("InfoHUTblSet create", data);
            
                                    if (idx == _aPickDtlTo.length - 1) {
                                        _this.closeLoadingDialog();
                                        _this.onNavBack();
                                    }
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    _this.closeLoadingDialog();
                                }
                            });
                        }, 100);
                    })
                } else {
                    MessageBox.information(_oCaption.WARN_NO_DATA_MODIFIED);
                }
            },

            onRefreshPickHdr() {
                _this.getPickHdr();
            },

            onCancelPickHdr() {
                MessageBox.confirm(_oCaption.CONFIRM_PROCEED_CLOSE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.onNavBack();
                        }
                    }
                });
            },

            getPickDtl() {
                var oModel = this.getOwnerComponent().getModel();
                var aData = _this.getView().getModel("pickHdr").getData().results;
                _aPickDtl = [];
                _aPickDtlTo = [];

                aData.forEach((item, idx) => {
                    var sPlantCd = item.ISSPLANT;
                    var sMatNo = item.ISSMATNO;
                    var sBatch = item.ISSBATCH;
                    var sSloc = item.ISSSLOC;

                    var sFilter = "PLANTCD eq '" + sPlantCd + "' and MATNO eq '" + sMatNo + 
                    "' and BATCH eq '" + sBatch + "' and SLOC eq '" + sSloc + "'";
                    
                    oModel.read("/PickDetailSet", {
                        urlParameters: {
                            "$filter": sFilter
                        },
                        success: function (data, response) {
                            console.log("PickDetailSet read", data);

                            data.results.forEach(itemData => {
                                if (_aPickDtl.filter(x => x.HUID == itemData.HUID && x.HUITEM == itemData.HUITEM).length == 0) {
                                    _aPickDtl.push(...data.results);
                                }
                            })
                            
                            if (idx == aData.length - 1) {
                                _this.setPickDtl();
                            }
    
                            _this.closeLoadingDialog();
                        },
                        error: function (err) {
                            _this.closeLoadingDialog();
                        }
                    })
                })
            },

            setPickDtl() {
                var aPickDtl = jQuery.extend(true, [], _aPickDtl);
                var aPickDtlFiltered = {results:[]};

                var oDataUI = _this.getView().getModel("ui").getData();
                aPickDtlFiltered.results.push(...aPickDtl.filter(x => x.PLANTCD == oDataUI.plantCd && 
                    x.MATNO == oDataUI.matNo && x.BATCH == oDataUI.batch && x.SLOC == oDataUI.sloc));

                aPickDtlFiltered.results.forEach(item => {
                    var iIdx = _aPickDtlTo.findIndex(x => x.huId == item.HUID && x.huItem == item.HUITEM);
                    if (iIdx > -1) {
                        item.TOQTY = parseFloat(_aPickDtlTo[iIdx].toQty).toString();
                    }

                    item.BALANCE = (parseFloat(item.QTY) - parseFloat(item.TOQTY)).toString();
                })
                
                var oJSONModel = new sap.ui.model.json.JSONModel();
                oJSONModel.setData(aPickDtlFiltered);
                _this.getView().setModel(oJSONModel, "pickDtl");

                _this.setRowReadMode("pickDtl");
            },

            onAutoPickDtl() {
                var oTable = this.byId("pickDtlTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                var oDataUI = _this.getView().getModel("ui").getData();

                aOrigSelIdx.forEach(item => {
                    var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => 
                        x.DLVNO == oDataUI.dlvNo && x.DLVITEM == oDataUI.dlvItem)[0];
                    var iBalHdr = parseFloat(oDataHdr.BALANCE);

                    if (iBalHdr > 0) {
                        var oDataDtl = _this.getView().getModel("pickDtl").getData().results[item];
                
                        var iQty = (parseFloat(oDataDtl.QTY) > iBalHdr ? (parseFloat(oDataDtl.QTY) - iBalHdr) : 0);
                        var iToQty = parseFloat(oDataDtl.QTY) - iQty;
                        var iBalDtl = parseFloat(oDataDtl.QTY) - iToQty;
    
                        _this.getView().getModel("pickDtl").setProperty("/results/" + item.toString() + "/TOQTY", iToQty.toString());
                        _this.getView().getModel("pickDtl").setProperty("/results/" + item.toString() + "/BALANCE", iBalDtl.toString());
    
                        _this.setPickDtlTo();
                    }
                })
            },

            onEditPickDtl() {
                var aRows = this.getView().getModel("pickDtl").getData().results;

                if (aRows.length > 0) {
                    _this.byId("btnAutoPickDtl").setVisible(false);
                    _this.byId("btnEditPickDtl").setVisible(false);
                    _this.byId("btnRefreshPickDtl").setVisible(false);
                    _this.byId("btnSavePickDtl").setVisible(true);
                    _this.byId("btnCancelPickDtl").setVisible(true);
    
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("pickDtl").getData());
                    _this.setRowEditMode("pickDtl");
                } else {
                    MessageBox.warning(_oCaption.INFO_NO_DATA_EDIT);
                }
            },

            onRefreshPickDtl() {
                var oDataUI = _this.getView().getModel("ui").getData();
                
                _this.getView().getModel("pickDtl").getData().results.forEach((item, idx) => {
                    _this.getView().getModel("pickDtl").setProperty("/results/" + idx.toString() + "/TOQTY", "0");

                    var iDelIdx = _aPickDtlTo.findIndex(x => x.dlvItem == oDataUI.DLVITEM && 
                        x.huId == item.HUID && x.huItem == item.HUITEM);

                    _aPickDtlTo.splice(iDelIdx, 1);
                })

                _this.setPickDtlTo();
                _this.setPickDtl();
            },

            onSavePickDtl() {
                var oTable = this.byId("pickDtlTab");
                var aEditedRows = this.getView().getModel("pickDtl").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    // Validation UOM
                    var sErrType = "";
                    var sUom = "";
                    var iUomDecimal = 0;

                    aEditedRows.forEach((item, idx) => {
                        var aNum = parseFloat(item.TOQTY).toString().split(".");

                        if (item.UOMDECIMAL == 0) {
                            if (!Number.isInteger(parseFloat(item.TOQTY))) sErrType = "UOMDECIMAL";
                        } else if (item.UOMDECIMAL > 0) {
                            if (aNum.length == 1) sErrType = "UOMDECIMAL";
                            else if (aNum[1].length != item.UOMDECIMAL) sErrType = "UOMDECIMAL";
                        }
                        
                        if (parseFloat(item.TOQTY) > parseFloat(item.QTY)) {
                            sErrType = "OVERQTY";
                        }

                        if (sErrType) {
                            sUom = item.UOM;
                            iUomDecimal = item.UOMDECIMAL;
                        }
                    });

                    if (sErrType) {
                        var sErrMsg = "";
                        
                        if (sErrType == "UOMDECIMAL") {
                            sErrMsg = "UOM " + sUom + " should only have " + iUomDecimal.toString() + " decimal place(s).";
                        } else if (sErrType == "OVERQTY") {
                            sErrMsg = "TO Quantity is greater than Quantity.";
                        }

                        MessageBox.warning(sErrMsg);
                        return;
                    }

                    aEditedRows.forEach((item, idx) => {
                        var iIdx = _this.getView().getModel("pickDtl").getData().results.filter(x => 
                                x.HUID == item.HUID && x.HUITEM == item.HUITEM
                            );
                        
                        _this.getView().getModel("pickDtl").setProperty("/results/" + iIdx.toString() + "/TOQTY", item.TOQTY);
                        
                    })

                    _this.setPickDtlTo();
                    _this.setPickDtl();

                    _this.byId("btnAutoPickDtl").setVisible(true);
                    _this.byId("btnEditPickDtl").setVisible(true);
                    _this.byId("btnRefreshPickDtl").setVisible(true);
                    _this.byId("btnSavePickDtl").setVisible(false);
                    _this.byId("btnCancelPickDtl").setVisible(false);
                } else {
                    MessageBox.information(_oCaption.WARN_NO_DATA_MODIFIED);
                }
            },

            onCancelPickDtl() {
                var aEditedRows = this.getView().getModel("pickDtl").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {

                                _this.byId("btnAutoPickDtl").setVisible(true);
                                _this.byId("btnEditPickDtl").setVisible(true);
                                _this.byId("btnRefreshPickDtl").setVisible(true);
                                _this.byId("btnSavePickDtl").setVisible(false);
                                _this.byId("btnCancelPickDtl").setVisible(false);

                                _this.onRefreshPickDtl();
                            }
                        }
                    });
                } else {
                    _this.byId("btnAutoPickDtl").setVisible(true);
                    _this.byId("btnEditPickDtl").setVisible(true);
                    _this.byId("btnRefreshPickDtl").setVisible(true);
                    _this.byId("btnSavePickDtl").setVisible(false);
                    _this.byId("btnCancelPickDtl").setVisible(false);

                    _this.onRefreshPickDtl();
                }
            },

            setPickDtlTo() {
                // Save Pick Detail
                var oDataUI = _this.getView().getModel("ui").getData();

                _this.getView().getModel("pickDtl").getData().results.forEach(item => {
                    if (parseFloat(item.TOQTY) > 0) {
                        var iIdx = _aPickDtlTo.findIndex(x => x.dlvItem == oDataUI.dlvItem && 
                            x.huId == item.HUID && x.huItem == item.HUITEM);

                        if (iIdx == -1) {
                            _aPickDtlTo.push({
                                dlvItem: oDataUI.dlvItem,
                                huId: item.HUID,
                                huItem: item.HUITEM,
                                plantCd: item.PLANTCD,
                                matNo: item.MATNO,
                                batch: item.BATCH,
                                sloc: item.SLOC,
                                toQty: item.TOQTY
                            })
                        } else {
                            _aPickDtlTo[iIdx].toQty = item.TOQTY
                        }
                    }
                });

                // Set Pick Header
                _this.setPickHdrTo();
            },

            setPickHdrTo() {
                var oDataUI = _this.getView().getModel("ui").getData();
                var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => 
                    x.DLVNO == oDataUI.dlvNo && x.DLVITEM == oDataUI.dlvItem)[0];
                var iIdxHdr = _this.getView().getModel("pickHdr").getData().results.findIndex(x => 
                    x.DLVNO == oDataUI.dlvNo && x.DLVITEM == oDataUI.dlvItem);

                var aDataDtl = _aPickDtlTo.filter(x => x.plantCd == oDataHdr.ISSPLANT && 
                    x.matNo == oDataHdr.ISSMATNO && x.batch == oDataHdr.ISSBATCH && x.sloc == oDataHdr.ISSSLOC);

                var iTotalToQty = 0.0;
                aDataDtl.forEach(item => {
                    iTotalToQty += parseFloat(item.toQty);
                });

                // Set Header
                _this.getView().getModel("pickHdr").setProperty("/results/" + iIdxHdr.toString() + "/PICKQTY", iTotalToQty.toString());
                var iBalHdr = parseFloat(oDataHdr.REQQTY) - parseFloat(oDataHdr.ISSQTY) - iTotalToQty;
                _this.getView().getModel("pickHdr").setProperty("/results/" + iIdxHdr.toString() + "/BALANCE", iBalHdr.toString());
            },

            onCellClickPickHdr(oEvent) {
                var oData = oEvent.getParameters().rowBindingContext.getObject();
                var sPlantCd = oData.ISSPLANT;
                var sMatNo = oData.ISSMATNO;
                var sBatch = oData.ISSBATCH;
                var sSloc = oData.ISSSLOC;
                var sDlvItem = oData.DLVITEM;

                this.onCellClick(oEvent);

                _this.getView().getModel("ui").setProperty("/plantCd", sPlantCd);
                _this.getView().getModel("ui").setProperty("/matNo", sMatNo);
                _this.getView().getModel("ui").setProperty("/batch", sBatch);
                _this.getView().getModel("ui").setProperty("/sloc", sSloc);
                _this.getView().getModel("ui").setProperty("/dlvItem", sDlvItem);

                _this.setPickDtl();
            },

            onRowSelectionChangePickHdr(oEvent) {
                var sPath = oEvent.getParameters().rowContext.sPath;

                var sPlantCd = _this.getView().getModel("pickHdr").getProperty(sPath).ISSPLANT;
                var sMatNo = _this.getView().getModel("pickHdr").getProperty(sPath).ISSMATNO;
                var sBatch = _this.getView().getModel("pickHdr").getProperty(sPath).ISSBATCH;
                var sSloc = _this.getView().getModel("pickHdr").getProperty(sPath).ISSSLOC;
                var sDlvItem = _this.getView().getModel("pickHdr").getProperty(sPath).DLVITEM;

                _this.getView().getModel("ui").setProperty("/plantCd", sPlantCd);
                _this.getView().getModel("ui").setProperty("/matNo", sMatNo);
                _this.getView().getModel("ui").setProperty("/batch", sBatch);
                _this.getView().getModel("ui").setProperty("/sloc", sSloc);
                _this.getView().getModel("ui").setProperty("/dlvItem", sDlvItem);

                _this.setPickDtl();
            },

            onNavBack() {
                _this._router.navTo("RouteDeliveryInfo", {
                    sbu: _this.getView().getModel("ui").getData().sbu,
                    dlvNo: _this.getView().getModel("ui").getData().dlvNo
                }, true);
            },

            onInputLiveChange(oEvent) {},

            onNumberLiveChange(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var dValue = oEvent.getParameters().value;

                _this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            },

            onKeyUp(oEvent) {
                if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    var sModel = "";
                    if (oTable.getId().indexOf("pickHdrTab") >= 0) sModel = "pickHdr";
                    else if (oTable.getId().indexOf("pickDtlTab") >= 0) sModel = "pickDtl";

                    if (sModel == "pickHdr") {
                        var sRowId = this.byId(oEvent.srcControl.sId);
                        var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["pickHdr"].sPath;
                        var oRow = this.getView().getModel("pickHdr").getProperty(sRowPath);
                        var sPlantCd = oRow.ISSPLANT;
                        var sMatNo = oRow.ISSMATNO;
                        var sBatch = oRow.ISSBATCH;
                        var sSloc = oRow.ISSSLOC;
                        var sDlvItem = oRow.DLVITEM;

                        _this.getView().getModel("ui").setProperty("/plantCd", sPlantCd);
                        _this.getView().getModel("ui").setProperty("/matNo", sMatNo);
                        _this.getView().getModel("ui").setProperty("/batch", sBatch);
                        _this.getView().getModel("ui").setProperty("/sloc", sSloc);
                        _this.getView().getModel("ui").setProperty("/dlvItem", sDlvItem);

                        _this.setPickDtl();
                    }

                    if (this.byId(oEvent.srcControl.sId).getBindingContext(sModel)) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext(sModel).sPath;

                        oTable.getModel(sModel).getData().results.forEach(row => row.ACTIVE = "");
                        oTable.getModel(sModel).setProperty(sRowPath + "/ACTIVE", "X");

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext(sModel) && row.getBindingContext(sModel).sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
                    }
                }
            },

            getCaption() {
                var oJSONModel = new JSONModel();
                var oCaptionParam = [];
                var oCaptionResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                // Button
                oCaptionParam.push({CODE: "ADD"});
                oCaptionParam.push({CODE: "EDIT"});
                oCaptionParam.push({CODE: "REFRESH"});
                oCaptionParam.push({CODE: "SAVE"});
                oCaptionParam.push({CODE: "CANCEL"});
                oCaptionParam.push({CODE: "AUTOPICK"});

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                oCaptionParam.push({CODE: "INFO_NO_DATA_EDIT"});
                oCaptionParam.push({CODE: "CONFIRM_DISREGARD_CHANGE"});
                oCaptionParam.push({CODE: "WARN_NO_DATA_MODIFIED"});
                oCaptionParam.push({CODE: "INFO_NO_ITEM_TO_PICK"});
                
                oModel.create("/CaptionMsgSet", { CaptionMsgItems: oCaptionParam  }, {
                    method: "POST",
                    success: function(oData, oResponse) {
                        oData.CaptionMsgItems.results.forEach(item => {
                            oCaptionResult[item.CODE] = item.TEXT;
                        })

                        oJSONModel.setData(oCaptionResult);
                        _this.getView().setModel(oJSONModel, "caption");

                        _oCaption = _this.getView().getModel("caption").getData();
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });
            }
        });
    });