import * as Fastify from 'fastify';
import * as fp from 'fastify-plugin';

import { CaseFormat } from './mapper';
import { fastifyTransformBody } from './plugin';

const fastify = Fastify({
  logger: true,
});

const fastifyTransformBodyOptions = {
  transformBody: {
    internalCaseFormat: CaseFormat.CamelCase,
    validateRequestBody: false,
    caseFormatResolver: async request => {
      const ua = request.headers['user-agent'];
      if (ua.includes('node')) {
        return CaseFormat.CamelCase;
      }
      if (ua.includes('python')) {
        return CaseFormat.SnakeCase;
      }
      return null;
    },
  },
};

const fastifyTransformBodyPlugin = fp(fastifyTransformBody);

fastify.register(fastifyTransformBodyPlugin, fastifyTransformBodyOptions).after(async err => {
  if (err) {
    console.log('Transform body plugin errored');
    throw err;
  }
});

fastify.post('/', async (request, reply) => {
  return {
    inference: [
      {
        typename: 'FileColumnStructure',
        data_type: 'integer',
        dw_col_name: 'ID',
        original_name: 'Row ID',
        semantic_type: 'id',
        semantic_category: 'id_code',
      },
      {
        camelCaseOne: 'FileColumnStructure',
        camelCaseTwo: 'integer',
      },
      {
        one_two_three: {
          four_five: {
            six_seven: {
              'Two Words': {
                x: 1,
                y: 2,
              },
              BLA_BLA_BLA: 3,
            },
          },
        },
      },
      request.body,
    ],
  };
});

fastify.get('/', async (request, reply) => {
  reply.code(200);
  return {
    config: [
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'total_sales',
        plate_type: 'total_time',
        plate_title: 'Total Sales',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'card',
        x_axis: [],
        y_axis: ['calc_val', 'raw_val'],
        split_by: [],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'total_sales_split',
        plate_type: 'total_time',
        plate_title: 'Total Sales by Category',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'vertical_bar',
        x_axis: ['category', 'tag', 'geo'],
        y_axis: ['calc_val', 'raw_val'],
        split_by: ['category', 'tag', 'geo'],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'total_sales_over_time',
        plate_type: 'time_series',
        plate_title: 'Total Sales Over Time',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'stacked_line',
        x_axis: ['date_time'],
        y_axis: ['calc_val', 'raw_val'],
        split_by: [],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'total_sales_split_over_time',
        plate_type: 'time_series',
        plate_title: 'Total Sales by Category; Over Time',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'multi_line',
        x_axis: ['date_time'],
        y_axis: ['calc_val', 'raw_val'],
        split_by: ['category', 'tag', 'geo'],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'avg_sales',
        plate_type: 'total_time',
        plate_title: 'Average Sales per Unit of Time',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'card',
        x_axis: [],
        y_axis: ['calc_val', 'raw_val'],
        split_by: [],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'avg_sales_split',
        plate_type: 'total_time',
        plate_title: 'Average Sales by Category',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'vertical_bar',
        x_axis: ['category', 'tag', 'geo'],
        y_axis: ['calc_val', 'raw_val'],
        split_by: ['category', 'tag', 'geo'],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'avg_sales_over_time',
        plate_type: 'time_series',
        plate_title: 'Average Sales Over Time',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'single_line',
        x_axis: ['date_time'],
        y_axis: ['calc_val', 'raw_val'],
        split_by: [],
        filter_by: ['category', 'tag', 'geo'],
      },
      {
        wok_type: 'sales',
        context: 'products',
        plate_name: 'avg_sales_split_over_time',
        plate_type: 'time_series',
        plate_title: 'Average Sales by Category; Over Time',
        agg_type: 'total',
        measurement: ['currency', 'count'],
        viz_type: 'multi_line',
        x_axis: ['date_time'],
        y_axis: ['calc_val', 'raw_val'],
        split_by: ['category', 'tag', 'geo'],
        filter_by: ['category', 'tag', 'geo'],
      },
    ],
  };
});

fastify.listen(3001, (err, address) => {
  if (err) {
    throw err;
  }
  fastify.log.info(`server listening on ${address}`);
});
