<template>
  <div class="q-pa-xs">
    <!-- changeLog Post-->

    <div class="q-pa-md col-12">
      <q-form @submit="gerar(changeLogPostModel)" class="row">
        <q-input
          class="col-12"
          v-model="changeLogPostModel.urlOld"
          label="Url versão anterior"
          :rules="[(val) => !!val || 'Campo obrigatório']"
        />
        <q-input
          class="col-12"
          v-model="changeLogPostModel.urlCurrent"
          label="Url versão atual"
          :rules="[(val) => !!val || 'Campo obrigatório']"
        />

        <q-input
          class="col-3 col-md-3 col-sm-6 col-xs-12"
          v-model="changeLogPostModel.templateDescription.templateAdded"
          label="Template - Adicionado"
        />
        <q-input
          class="col-3 col-md-3 col-sm-6 col-xs-12"
          v-model="changeLogPostModel.templateDescription.templateEdited"
          label="Template - Alterado"
        />
        <q-input
          class="col-3 col-md-3 col-sm-6 col-xs-12"
          v-model="changeLogPostModel.templateDescription.templateRemoved"
          label="Template - Removido"
        />
        <q-input
          class="col-3 col-md-3 col-sm-6 col-xs-12"
          v-model="changeLogPostModel.templateDescription.templateRequired"
          label="Template - Mandatoriedade"
        />
        <div class="col-12 items-center">
          <q-btn
            class="q-mt-sm col-md-auto"
            label="Gerar change log"
            type="submit"
            color="primary"
          />
        </div>
      </q-form>
    </div>

    <!-- changeLog List view-->
    <div class="q-pa-md col-12" v-if="endpointChangeLogList.length > 0">
      <q-btn
        color="dark"
        icon-right="archive"
        label="Export to csv"
        no-caps
        @click="exportTable"
      />
      <q-list bordered class="bordered">
        <q-expansion-item
          expand-separator
          group="somegroup"
          switch-toggle-side
          class="shadow-1 overflow-hidden"
          v-for="item in endpointChangeLogList"
          :label="item.endpoint"
        >
          <q-card>
            <q-card-section>
              <div class="q-pa-md">
                <q-table
                  :rows="item.changes"
                  :columns="columns"
                  row-key="name"
                  :visible-columns="visibleColumns"
                >
                  <template v-slot:top="props">
                    <q-space />

                    <div v-if="$q.screen.gt.xs" class="col">
                      <q-toggle
                        v-model="visibleColumns"
                        val="path"
                        label="Path"
                      />
                      <q-toggle
                        v-model="visibleColumns"
                        val="field"
                        label="Field"
                      />
                      <q-toggle
                        v-model="visibleColumns"
                        val="description"
                        label="Description"
                      />
                      <q-toggle
                        v-model="visibleColumns"
                        val="oldValue"
                        label="Old value"
                      />
                      <q-toggle
                        v-model="visibleColumns"
                        val="currentValue"
                        label="Current value"
                      />
                    </div>
                    <q-select
                      v-else
                      v-model="visibleColumns"
                      multiple
                      borderless
                      dense
                      options-dense
                      :display-value="$q.lang.table.columns"
                      emit-value
                      map-options
                      :options="columns"
                      option-value="name"
                      style="min-width: 150px"
                    />

                    <q-btn
                      flat
                      round
                      dense
                      :icon="
                        props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'
                      "
                      @click="props.toggleFullscreen"
                      class="q-ml-md"
                    />
                  </template>
                </q-table>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script lang="ts">
import { Loading, Notify } from "quasar";
import {
  ChangeLogPostModel,
  ChangeLogListModel,
  EndpointChangeLogListModel,
} from "components/models";
import ChangeLogListComponent from "components/ChangeLogListComponent.vue";
import { defineComponent, PropType, computed, ref, toRef, Ref } from "vue";
import { exportFile, useQuasar } from "quasar";
import axios from "axios";
const columns = [
  { name: "path", label: "Path", field: "path", align: "left", sortable: true },
  {
    name: "field",
    label: "Field",
    field: "field",
    align: "left",
    sortable: true,
  },
  {
    name: "description",
    label: "Description",
    field: "description",
    align: "left",
    sortable: true,
  },
  {
    name: "oldValue",
    label: "Old value",
    field: "oldValue",
    align: "left",
    sortable: true,
  },
  {
    name: "currentValue",
    label: "Current value",
    field: "currentValue",
    align: "left",
    sortable: true,
  },
];

function groupByEndPoint(list: ChangeLogListModel[]) {
  const map = new Map();
  list.forEach((item) => {
    const key = item.endpoint;
    const collection = map.get(key);
    if (!collection) {
      map.set(key, [item]);
    } else {
      collection.push(item);
    }
  });
  return map;
}

export default defineComponent({
  name: "ChangeLogPage",
  components: { ChangeLogListComponent },
  data() {
    let endpointChangeLogList: EndpointChangeLogListModel[] = [];
    let changeLogList: ChangeLogListModel[] = [];
    const changeLogPostModel: ChangeLogPostModel = {
      urlOld:
        "https://raw.githubusercontent.com/OpenBanking-Brasil/openapi/main/swagger-apis/accounts/1.0.3.yml",
      urlCurrent:
        "https://raw.githubusercontent.com/OpenBanking-Brasil/openapi/main/swagger-apis/accounts/2.0.0.yml",
      templateDescription: {
        templateAdded: 'Adicionado - "${field}"',
        templateEdited: 'Alterado - "${field}"',
        templateRemoved: 'Removido - "${field}"',
        templateRequired: "Alterado mandatoriedade",
      },
    };

    return {
      changeLogPostModel: changeLogPostModel,
      changes: changeLogList,
      endpointChangeLogList: endpointChangeLogList,
    };
  },
  methods: {
    showLoading() {
      Loading.show();
    },
    hideLoading() {
      Loading.hide();
    },
    validations(changeLog: ChangeLogPostModel) {
      let strErros: string[] = [];
      if (!changeLog.urlOld && changeLog.urlOld.length == 0) {
        strErros.push("Url antiga é de preenchimento obrigatório");
      }

      if (!changeLog.urlOld && changeLog.urlOld.length == 0) {
        strErros.push("Url antiga é de preenchimento obrigatório");
      }
    },
    gerar(changeLog: ChangeLogPostModel) {
      this.endpointChangeLogList = [];
      this.showLoading();
      this.validations(changeLog);
      axios
        .post(
          "https://change-log-yml.herokuapp.com/change-log/generate-change-log",
          changeLog
        )
        .then((response: any) => {
          this.changes = response.data.obj.changesLog;
          let resultGroup = groupByEndPoint(this.changes);
          for (let key of resultGroup.keys()) {
            this.endpointChangeLogList.push({
              endpoint: key,
              changes: resultGroup.get(key),
            });
          }
          //  this.endpointChangeLogList = groupByEndPoint(this.changes)
          console.log(response.data.obj.changesLog.length);
        })
        .catch((error: any) => {
          console.log(error.response);

          Notify.create({
            type: "negative",
            message: error.response.data.message,
          });
        })
        .finally((x) => {
          this.hideLoading();
        });
    },
    wrapCsvValue(val, formatFn) {
      val = val.split('"').join('""');
      return `"${val}"`;
    },

    exportTable() {
      // naive encoding to csv format
      let contentArray: string[] = [];
      let content = "";
      contentArray.push(
        `endpoint;path;field;description;oldValue;currentValue`
      );
      this.changes.forEach((change) => {
        
        contentArray.push(`${ this.wrapCsvValue(change.endpoint)};${this.wrapCsvValue(change.path)};${this.wrapCsvValue(change.field)};${this.wrapCsvValue(change.description)};${this.wrapCsvValue(change.oldValue)};${this.wrapCsvValue(change.currentValue)}`)

      });
      content = contentArray.join("\n");
      const status = exportFile("table-export.csv", content, "text/csv");
    },
  },
  setup() {
    return {
      columns,
      visibleColumns: ref(["path", "description", "field"]),
    };
  },
});
</script>
