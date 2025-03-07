import { Injectable } from '@angular/core';
import {
  IQuery,
  IQueryCollection,
} from 'altair-graphql-core/build/types/state/collection.interfaces';
import { map } from 'rxjs/operators';
import {
  FullQueryCollection,
  initializeClient,
} from '@altairgraphql/api-utils';
import { AccountService } from '../account/account.service';
import { CreateDTO } from 'altair-graphql-core/build/types/shared';
import { TeamId } from 'altair-graphql-core/build/types/state/account.interfaces';
import { QueryItem } from '@altairgraphql/db';
import { environment } from 'environments/environment';

export const apiClient = initializeClient(
  environment.production ? 'production' : 'development'
);
const serverQueryToLocalQuery = (query: QueryItem): IQuery => {
  return {
    ...(query.content as unknown as IQuery),
    id: query.id,
    created_at: +query.createdAt,
    updated_at: +query.updatedAt,
    storageType: 'api',
  };
};
const serverCollectionToLocalCollection = (
  collection: FullQueryCollection
): IQueryCollection => {
  return {
    id: collection.id,
    title: collection.name,
    queries: collection.queries.map(serverQueryToLocalQuery),
    storageType: 'api',
  };
};
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private accountService: AccountService) {}

  async createQueryCollection(
    queryCollection: CreateDTO<IQueryCollection>,
    parentCollectionId?: string,
    teamId?: TeamId
  ) {
    return await apiClient.createQueryCollection({
      name: queryCollection.title,
      teamId: teamId?.value(),
      queries: queryCollection.queries.map((q) => ({
        name: q.windowName,
        content: q,
      })),
    });
  }

  async createQuery(collectionServerId: string, query: IQuery) {
    return await apiClient.createQuery({
      collectionId: collectionServerId,
      name: query.windowName,
      content: {
        ...query,
      },
    });
  }

  async updateQuery(queryServerId: string, query: IQuery) {
    return await apiClient.updateQuery(queryServerId, {
      name: query.windowName,
      content: {
        ...query,
      },
    });
  }

  async deleteQuery(queryServerId: string) {
    return await apiClient.deleteQuery(queryServerId);
  }

  async updateCollection(
    collectionServerId: string,
    collection: IQueryCollection,
    parentCollectionServerId?: string
  ) {
    return await apiClient.updateCollection(collectionServerId, {
      name: collection.title,
      queries: collection.queries.map((q) => ({
        name: q.windowName,
        content: {
          ...q,
          collectionId: q.collectionId || '',
        },
        collectionId: q.collectionId || '',
      })),
    });
  }

  async deleteCollection(collectionServerId: string) {
    return await apiClient.deleteCollection(collectionServerId);
  }

  async getCollection(
    collectionServerId: string
  ): Promise<IQueryCollection | undefined> {
    const res = await apiClient.getCollection(collectionServerId);
    if (!res) {
      return;
    }

    return serverCollectionToLocalCollection(res);
  }

  async getCollections(): Promise<IQueryCollection[]> {
    const collections = await apiClient.getCollections();
    return collections.map(serverCollectionToLocalCollection);
  }

  // TODO: Handle team collections
  listenForCollectionChanges() {
    return apiClient.listenForEvents().pipe(
      map((x) => {
        return x;
      })
      // takeUntil(this.accountService.observeSignout())
    );
  }
}
