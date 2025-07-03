const mongoose = require("mongoose");
const sharp = require("sharp");
const { ObjectId } = mongoose.Types;
const { UTApi } = require("uploadthing/server");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const message = "Internal server error";

const stringSlug = (string, sign = "-") => {
  return string
    .toLowerCase()
    .replace(/[\s_&]+/g, sign)
    .replace(/-+/g, sign)
    .replace(/[^\w\-]/g, "")
    .replace(/^-|-$/g, "");
};

const randomKey = (length = 5, stringOnly = false) => {
  if (stringOnly) {
    const characters = "abcdefghijklmnopqrstuvwxyz";
    return [...Array(length)]
      .map(() => characters[Math.floor(Math.random() * characters.length)])
      .join("");
  } else {
    return [...Array(length)].map(() => Math.random().toString(36)[2]).join("");
  }
};

const paginate = (page, perPage) => {
  page = Math.max(Number(page) || 1, 1);
  const limit = Math.max(Number(perPage) || 1, 1);
  const skip = (page - 1) * limit;

  return [{ $skip: skip }, { $limit: limit }];
};

const hasOne = (localField, fromCollection, asField, select = []) => {
  const lookupPipeline = [
    {
      $match: {
        $expr: {
          $eq: ["$_id", `$$${localField}`],
        },
      },
    },
  ];

  if (select.length > 0) {
    const project = {};
    for (const key of select) {
      project[key] = 1;
    }
    lookupPipeline.push({ $project: project });
  }

  return [
    {
      $lookup: {
        from: fromCollection,
        let: { [localField]: `$${localField}` },
        pipeline: lookupPipeline,
        as: asField,
      },
    },
    {
      $addFields: {
        [asField]: {
          $cond: {
            if: { $gt: [{ $size: `$${asField}` }, 0] },
            then: { $arrayElemAt: [`$${asField}`, 0] },
            else: null,
          },
        },
      },
    },
  ];
};

const hasMany = (
  from,
  localField,
  foreignField,
  as,
  select = [],
  additionalCriteria = {}
) => {
  const pipeline = [];
  if (Object.keys(additionalCriteria).length) {
    pipeline.push({
      $match: additionalCriteria,
    });
  }
  if (select.length) {
    pipeline.push({
      $project: Object.fromEntries(select.map((key) => [key, 1])),
    });
  }

  return [
    {
      $lookup: {
        from,
        localField,
        foreignField,
        as,
        pipeline,
      },
    },
  ];
};

const toggle = (field) => {
  return [{ $set: { [field]: { $eq: [false, `$${field}`] } } }];
};

const objectID = (id) => {
  return new ObjectId(id);
};

const arrayConverter = (value) => {
  return Array.isArray(value) ? value : value ? [value] : [];
};

const encode = (value) => {
  return value ? btoa(value) : "";
};

const decode = (value) => {
  return value ? atob(value) : "";
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const sendError = (obj) => {
  throw new Error(JSON.stringify(obj));
};

const parseError = (error) => {
  try {
    return JSON.parse(error.message);
  } catch {
    return utils.message;
  }
};

const addDate = (count, date = new Date()) => {
  return new Date(date.getTime() + count * 24 * 60 * 60 * 1000);
};

const addMonth = (count, date = new Date()) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + count);
  return d.toISOString();
};

const addYear = (count, date = new Date()) => {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + count);
  return d.toISOString();
};

const startDate = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const endDate = (date = new Date()) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const compareDate = (date1, date2 = new Date()) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getTime() >= d2.getTime();
};

const isDev = process.env.NODE_ENV === "development";

const utapi = new UTApi();

const imageUpload = async (imageBuffer) => {
  try {
    if (!imageBuffer) return null;
    const metadata = await sharp(imageBuffer).metadata();
    const shouldResize = metadata.width > 2000 || metadata.height > 2000;
    const webpBuffer = shouldResize
      ? await sharp(imageBuffer)
          .resize({
            width: 2000,
            height: 2000,
            fit: sharp.fit.inside,
            withoutEnlargement: true,
          })
          .webp({ quality: 90 })
          .toBuffer()
      : await sharp(imageBuffer).webp({ quality: 90 }).toBuffer();

    const filename = `${randomKey(5)}`;
    const blob = new Blob([webpBuffer], {
      type: "application/octet-stream",
    });
    const uploadData = Object.assign(blob, { name: filename });

    const { data } = await utapi.uploadFiles(uploadData);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};

module.exports = {
  imageUpload,
  utapi,
  message,
  stringSlug,
  randomKey,
  paginate,
  hasOne,
  hasMany,
  toggle,
  objectID,
  arrayConverter,
  encode,
  decode,
  sleep,
  isValidURL,
  sendError,
  parseError,
  addDate,
  addMonth,
  addYear,
  startDate,
  endDate,
  compareDate,
  isDev,
};
