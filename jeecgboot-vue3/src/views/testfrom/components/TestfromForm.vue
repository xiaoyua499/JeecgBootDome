<template>
  <div style="min-height: 400px">
    <BasicForm @register="registerForm" />
    <div v-if="!formDisabled" style="width: 100%; text-align: center">
      <a-button @click="submitForm" pre-icon="ant-design:check" type="primary">提 交</a-button>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import { BasicForm, useForm } from '/@/components/Form/index';
  import { defHttp } from '/@/utils/http/axios';
  import { propTypes } from '/@/utils/propTypes';
  import { getBpmFormSchema } from '../Testfrom.data';
  import { saveOrUpdate } from '../Testfrom.api';

  export default defineComponent({
    name: 'TestfromForm',
    components: {
      BasicForm,
    },
    props: {
      formData: propTypes.object.def({}),
      formBpm: propTypes.bool.def(true),
    },
    setup(props) {
      const [registerForm, { setFieldsValue, setProps, getFieldsValue }] = useForm({
        labelWidth: 150,
        schemas: getBpmFormSchema(props.formData),
        showActionButtonGroup: false,
        baseColProps: { span: 24 },
      });

      const formDisabled = computed(() => {
        if (props.formData.disabled === false) {
          return false;
        }
        return true;
      });

      let formData = {};
      const queryByIdUrl = '/testdomefrom/testfrom/queryById';

      async function initFormData() {
        if (!props.formData?.dataId) {
          await setProps({ disabled: formDisabled.value });
          return;
        }
        const params = { id: props.formData.dataId };
        const data = await defHttp.get({ url: queryByIdUrl, params });
        formData = { ...data };
        await setFieldsValue(formData);
        await setProps({ disabled: formDisabled.value });
      }

      async function submitForm() {
        const data = getFieldsValue();
        const params = Object.assign({}, formData, data);
        await saveOrUpdate(params, true);
      }

      initFormData();

      return {
        registerForm,
        formDisabled,
        submitForm,
      };
    },
  });
</script>
