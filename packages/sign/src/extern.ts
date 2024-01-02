/**
 * !ref: https://github.com/aws-amplify/amplify-js/blob/84340816226f917f4e893895c105d5de52fb29c2/packages/core/src/Signer/Signer.ts#L106
 */
export interface Signer {
  signUrl(url: string, accessInfo: any, serviceInfo: any, expiration?: number): string;
}
