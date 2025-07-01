import { Connection, PublicKey } from '@solana/web3.js';
import type { TokenInformation } from '../../models/token';
import { getAsset } from '../rpc';
import { TokenInformationCache } from '../infrastructure/TokenInformationCache';
import { fetchDigitalAsset, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { publicKey as metaplexPublicKey } from '@metaplex-foundation/umi';
import { getTokenMetadata, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

export class GetTokenInformationCommand {
  private tokenMint: string;
  private connection: Connection;
  private cache: TokenInformationCache;

  constructor(tokenMint: string, connection: Connection) {
    this.tokenMint = tokenMint;
    this.connection = connection;
    this.cache = new TokenInformationCache();
  }

  async execute(): Promise<TokenInformation> {
    try {
      // Try to get from cache first
      const cachedData = await this.cache.get(this.tokenMint);

      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from network
      const metaplexResult = await this.getByMetaplex();

      if (metaplexResult) {
        // Save to cache
        await this.cache.set(metaplexResult);

        return metaplexResult;
      }

      const assetResult = await this.getFromAsset();

      if (assetResult) {
        // Save to cache
        await this.cache.set(assetResult);

        return assetResult;
      }

      return {
        mint: this.tokenMint,
        name: 'Unknown',
        symbol: 'UNK',
        decimals: 0,
        totalSupply: 0,
        icon: '',
        externalUrl: '',
      };
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Failed to fetch token information: ${error.message}`
          : 'Failed to fetch token information'
      );
    }
  }

  private async getFromAsset(): Promise<TokenInformation | null> {
    const asset = await getAsset(this.connection.rpcEndpoint, this.tokenMint);

    console.log(asset);

    if (asset.error) {
      return null;
    }

    if (asset.result?.mint_extensions) {
      const tokenInfo: TokenInformation = {
        mint: this.tokenMint,
        name: asset.result.content?.metadata.name ?? 'Unknown',
        symbol: asset.result.content?.metadata.symbol ?? 'UNK',
        decimals: asset.result.token_info.decimals,
        totalSupply: Number(asset.result.token_info.supply),
        icon: '',
        externalUrl: '',
      };

      const meta2022 = await getTokenMetadata(
        this.connection,
        new PublicKey(this.tokenMint),
        'confirmed',
        TOKEN_2022_PROGRAM_ID
      );

      if (meta2022?.uri) {
        const metaJson = await this.extractJsonUri(meta2022?.uri);

        tokenInfo.icon = metaJson.image || '';
        tokenInfo.externalUrl = metaJson.external_url || '';
      }

      return tokenInfo;
    }

    if (!asset.result?.content) {
      return null;
    }

    const jsonUri = asset.result.content.json_uri;

    const tokenMetadata = await this.extractJsonUri(jsonUri);

    const tokenInfo: TokenInformation = {
      mint: this.tokenMint,
      name: asset.result.content.metadata.name,
      symbol: asset.result.content.metadata.symbol,
      decimals: asset.result.token_info.decimals,
      totalSupply: Number(asset.result.token_info.supply),
      icon: tokenMetadata.image || '',
      externalUrl: tokenMetadata.external_url || '',
    };

    return tokenInfo;
  }

  private async extractJsonUri(jsonUri: string) {
    if (jsonUri.startsWith('data:application/json,')) {
      // Handle inline JSON data
      const jsonData = decodeURIComponent(jsonUri.replace('data:application/json,', ''));

      return JSON.parse(jsonData);
    } else {
      // Handle external URI
      const response = await fetch(jsonUri);

      if (!response.ok) {
        return {};
      }

      return await response.json();
    }
  }

  private async getByMetaplex(): Promise<TokenInformation | null> {
    const umi = createUmi(this.connection.rpcEndpoint).use(mplTokenMetadata());

    try {
      const dAsset = await fetchDigitalAsset(umi, metaplexPublicKey(this.tokenMint));

      const jsonUri = dAsset.metadata.uri;

      let imageUrl = '';

      let externalUrl = '';

      const jsonResponse = await fetch(jsonUri);
      if (jsonResponse.ok) {
        const jsonData = await jsonResponse.json();

        imageUrl = jsonData.image || '';

        externalUrl = jsonData.external_url || '';
      }

      return {
        mint: this.tokenMint,
        name: dAsset.metadata.name,
        symbol: dAsset.metadata.symbol,
        decimals: dAsset.mint.decimals,
        totalSupply: Number(dAsset.mint.supply),
        icon: imageUrl,
        externalUrl: externalUrl,
      };
    } catch {
      return null;
    }
  }
}
