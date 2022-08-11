export interface Todo {
  id: number;
  content: string;
}

export interface Meta {
  totalCount: number;
}

export interface ChangeLogPostModel{
    urlOld : string;
    urlCurrent : string;
    templateDescription: ChangeLogPostTemplateDescriptionModel;
}

export interface ChangeLogPostTemplateDescriptionModel{
  templateAdded : string;
  templateEdited : string;
  templateRemoved : string;
  templateRequired: string;
}

export interface EndpointChangeLogListModel{

  endpoint: string;
  changes : ChangeLogListModel[];
}


export interface ChangeLogListModel{
  currentValue: string;
  description: string;
  endpoint: string;
  field: string;
  oldValue: string;
  path: string;
}