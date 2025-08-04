export type PumpFunAmm = {
  address: 'pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA';
  metadata: {
    name: 'pump_amm';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'adminSetCoinCreator';
      discriminator: [242, 40, 117, 145, 73, 96, 105, 104];
      docs: ['Overrides the coin creator for a canonical pump pool'];
      accounts: [
        {
          name: 'adminSetCoinCreatorAuthority';
          signer: true;
          relations: ['globalConfig'];
        },
        {
          name: 'globalConfig';
        },
        {
          name: 'pool';
          writable: true;
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              }
            ];
          };
        },
        {
          name: 'program';
        }
      ];
      args: [
        {
          name: 'coinCreator';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'adminUpdateTokenIncentives';
      discriminator: [209, 11, 115, 87, 213, 23, 124, 204];
      accounts: [
        {
          name: 'admin';
          writable: true;
          signer: true;
          relations: ['globalConfig'];
        },
        {
          name: 'globalConfig';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108, 95, 99, 111, 110, 102, 105, 103];
              }
            ];
          };
        },
        {
          name: 'globalVolumeAccumulator';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108, 95, 118, 111, 108, 117, 109, 101, 95, 97, 99, 99, 117, 109, 117, 108, 97, 116, 111, 114];
              }
            ];
          };
        },
        {
          name: 'mint';
        },
        {
          name: 'globalIncentiveTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'globalVolumeAccumulator';
              },
              {
                kind: 'account';
                path: 'tokenProgram';
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
            program: {
              kind: 'const';
              value: [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
            };
          };
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              }
            ];
          };
        },
        {
          name: 'program';
        }
      ];
      args: [
        {
          name: 'startTime';
          type: 'i64';
        },
        {
          name: 'endTime';
          type: 'i64';
        },
        {
          name: 'secondsInADay';
          type: 'i64';
        },
        {
          name: 'dayNumber';
          type: 'u64';
        },
        {
          name: 'tokenSupplyPerDay';
          type: 'u64';
        }
      ];
    },
    {
      name: 'buy';
      discriminator: [102, 6, 61, 18, 1, 218, 235, 234];
      accounts: [
        {
          name: 'pool';
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'globalConfig';
        },
        {
          name: 'baseMint';
          relations: ['pool'];
        },
        {
          name: 'quoteMint';
          relations: ['pool'];
        },
        {
          name: 'userBaseTokenAccount';
          writable: true;
        },
        {
          name: 'userQuoteTokenAccount';
          writable: true;
        },
        {
          name: 'poolBaseTokenAccount';
          writable: true;
          relations: ['pool'];
        },
        {
          name: 'poolQuoteTokenAccount';
          writable: true;
          relations: ['pool'];
        },
        {
          name: 'protocolFeeRecipient';
        },
        {
          name: 'protocolFeeRecipientTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'protocolFeeRecipient';
              },
              {
                kind: 'account';
                path: 'quoteTokenProgram';
              },
              {
                kind: 'account';
                path: 'quoteMint';
              }
            ];
            program: {
              kind: 'const';
              value: [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
            };
          };
        },
        {
          name: 'baseTokenProgram';
        },
        {
          name: 'quoteTokenProgram';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              }
            ];
          };
        },
        {
          name: 'program';
        },
        {
          name: 'coinCreatorVaultAta';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'coinCreatorVaultAuthority';
              },
              {
                kind: 'account';
                path: 'quoteTokenProgram';
              },
              {
                kind: 'account';
                path: 'quoteMint';
              }
            ];
            program: {
              kind: 'const';
              value: [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
            };
          };
        },
        {
          name: 'coinCreatorVaultAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 114, 101, 97, 116, 111, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'pool.coinCreator';
                account: 'Pool';
              }
            ];
          };
        },
        {
          name: 'globalVolumeAccumulator';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108, 95, 118, 111, 108, 117, 109, 101, 95, 97, 99, 99, 117, 109, 117, 108, 97, 116, 111, 114];
              }
            ];
          };
        },
        {
          name: 'userVolumeAccumulator';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [117, 115, 101, 114, 95, 118, 111, 108, 117, 109, 101, 95, 97, 99, 99, 117, 109, 117, 108, 97, 116, 111, 114];
              },
              {
                kind: 'account';
                path: 'user';
              }
            ];
          };
        }
      ];
      args: [
        {
          name: 'baseAmountOut';
          type: 'u64';
        },
        {
          name: 'maxQuoteAmountIn';
          type: 'u64';
        }
      ];
    },
    {
      name: 'sell';
      discriminator: [51, 230, 133, 164, 1, 127, 131, 173];
      accounts: [
        {
          name: 'pool';
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'globalConfig';
        },
        {
          name: 'baseMint';
          relations: ['pool'];
        },
        {
          name: 'quoteMint';
          relations: ['pool'];
        },
        {
          name: 'userBaseTokenAccount';
          writable: true;
        },
        {
          name: 'userQuoteTokenAccount';
          writable: true;
        },
        {
          name: 'poolBaseTokenAccount';
          writable: true;
          relations: ['pool'];
        },
        {
          name: 'poolQuoteTokenAccount';
          writable: true;
          relations: ['pool'];
        },
        {
          name: 'protocolFeeRecipient';
        },
        {
          name: 'protocolFeeRecipientTokenAccount';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'protocolFeeRecipient';
              },
              {
                kind: 'account';
                path: 'quoteTokenProgram';
              },
              {
                kind: 'account';
                path: 'quoteMint';
              }
            ];
            program: {
              kind: 'const';
              value: [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
            };
          };
        },
        {
          name: 'baseTokenProgram';
        },
        {
          name: 'quoteTokenProgram';
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'eventAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                path: [95, 95, 101, 118, 101, 110, 116, 95, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              }
            ];
          };
        },
        {
          name: 'program';
        },
        {
          name: 'coinCreatorVaultAta';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'coinCreatorVaultAuthority';
              },
              {
                kind: 'account';
                path: 'quoteTokenProgram';
              },
              {
                kind: 'account';
                path: 'quoteMint';
              }
            ];
            program: {
              kind: 'const';
              value: [140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89];
            };
          };
        },
        {
          name: 'coinCreatorVaultAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 114, 101, 97, 116, 111, 114, 95, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'pool.coinCreator';
                account: 'Pool';
              }
            ];
          };
        },
        {
          name: 'globalVolumeAccumulator';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108, 95, 118, 111, 108, 117, 109, 101, 95, 97, 99, 99, 117, 109, 117, 108, 97, 116, 111, 114];
              }
            ];
          };
        },
        {
          name: 'userVolumeAccumulator';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [117, 115, 101, 114, 95, 118, 111, 108, 117, 109, 101, 95, 97, 99, 99, 117, 109, 117, 108, 97, 116, 111, 114];
              },
              {
                kind: 'account';
                path: 'user';
              }
            ];
          };
        }
      ];
      args: [
        {
          name: 'baseAmountIn';
          type: 'u64';
        },
        {
          name: 'minQuoteAmountOut';
          type: 'u64';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'globalConfig';
      discriminator: [167, 232, 232, 177, 200, 108, 114, 127];
    },
    {
      name: 'pool';
      discriminator: [241, 154, 109, 4, 17, 177, 109, 188];
    },
    {
      name: 'globalVolumeAccumulator';
      discriminator: [45, 175, 179, 45, 116, 160, 222, 78];
    },
    {
      name: 'userVolumeAccumulator';
      discriminator: [197, 94, 159, 156, 62, 70, 225, 44];
    }
  ];
  events: [
    {
      name: 'adminSetCoinCreatorEvent';
      discriminator: [242, 40, 117, 145, 73, 96, 105, 104];
    },
    {
      name: 'buyEvent';
      discriminator: [102, 6, 61, 18, 1, 218, 235, 234];
    },
    {
      name: 'sellEvent';
      discriminator: [51, 230, 133, 164, 1, 127, 131, 173];
    },
    {
      name: 'createPoolEvent';
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119];
    }
  ];
  types: [
    {
      name: 'adminSetCoinCreatorEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'adminSetCoinCreatorAuthority';
            type: 'pubkey';
          },
          {
            name: 'baseMint';
            type: 'pubkey';
          },
          {
            name: 'pool';
            type: 'pubkey';
          },
          {
            name: 'oldCoinCreator';
            type: 'pubkey';
          },
          {
            name: 'newCoinCreator';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'buyEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'baseAmountOut';
            type: 'u64';
          },
          {
            name: 'maxQuoteAmountIn';
            type: 'u64';
          },
          {
            name: 'userBaseTokenReserves';
            type: 'u64';
          },
          {
            name: 'userQuoteTokenReserves';
            type: 'u64';
          },
          {
            name: 'poolBaseTokenReserves';
            type: 'u64';
          },
          {
            name: 'poolQuoteTokenReserves';
            type: 'u64';
          },
          {
            name: 'quoteAmountIn';
            type: 'u64';
          },
          {
            name: 'lpFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'lpFee';
            type: 'u64';
          },
          {
            name: 'protocolFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'protocolFee';
            type: 'u64';
          },
          {
            name: 'quoteAmountInWithLpFee';
            type: 'u64';
          },
          {
            name: 'userQuoteAmountIn';
            type: 'u64';
          },
          {
            name: 'pool';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userBaseTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'userQuoteTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'protocolFeeRecipient';
            type: 'pubkey';
          },
          {
            name: 'protocolFeeRecipientTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'coinCreator';
            type: 'pubkey';
          },
          {
            name: 'coinCreatorFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'coinCreatorFee';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'sellEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'baseAmountIn';
            type: 'u64';
          },
          {
            name: 'minQuoteAmountOut';
            type: 'u64';
          },
          {
            name: 'userBaseTokenReserves';
            type: 'u64';
          },
          {
            name: 'userQuoteTokenReserves';
            type: 'u64';
          },
          {
            name: 'poolBaseTokenReserves';
            type: 'u64';
          },
          {
            name: 'poolQuoteTokenReserves';
            type: 'u64';
          },
          {
            name: 'quoteAmountOut';
            type: 'u64';
          },
          {
            name: 'lpFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'lpFee';
            type: 'u64';
          },
          {
            name: 'protocolFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'protocolFee';
            type: 'u64';
          },
          {
            name: 'quoteAmountOutWithoutLpFee';
            type: 'u64';
          },
          {
            name: 'userQuoteAmountOut';
            type: 'u64';
          },
          {
            name: 'pool';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'userBaseTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'userQuoteTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'protocolFeeRecipient';
            type: 'pubkey';
          },
          {
            name: 'protocolFeeRecipientTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'coinCreator';
            type: 'pubkey';
          },
          {
            name: 'coinCreatorFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'coinCreatorFee';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'globalConfig';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'admin';
            docs: ['The admin pubkey'];
            type: 'pubkey';
          },
          {
            name: 'lpFeeBasisPoints';
            docs: ['The lp fee in basis points (0.01%)'];
            type: 'u64';
          },
          {
            name: 'protocolFeeBasisPoints';
            docs: ['The protocol fee in basis points (0.01%)'];
            type: 'u64';
          },
          {
            name: 'disableFlags';
            docs: [
              'Flags to disable certain functionality',
              'bit 0 - Disable create pool',
              'bit 1 - Disable deposit',
              'bit 2 - Disable withdraw',
              'bit 3 - Disable buy',
              'bit 4 - Disable sell'
            ];
            type: 'u8';
          },
          {
            name: 'protocolFeeRecipients';
            docs: ['Addresses of the protocol fee recipients'];
            type: {
              array: ['pubkey', 8];
            };
          },
          {
            name: 'coinCreatorFeeBasisPoints';
            docs: ['The coin creator fee in basis points (0.01%)'];
            type: 'u64';
          },
          {
            name: 'adminSetCoinCreatorAuthority';
            docs: ['The admin authority for setting coin creators'];
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'pool';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'poolBump';
            type: 'u8';
          },
          {
            name: 'index';
            type: 'u16';
          },
          {
            name: 'creator';
            type: 'pubkey';
          },
          {
            name: 'baseMint';
            type: 'pubkey';
          },
          {
            name: 'quoteMint';
            type: 'pubkey';
          },
          {
            name: 'lpMint';
            type: 'pubkey';
          },
          {
            name: 'poolBaseTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'poolQuoteTokenAccount';
            type: 'pubkey';
          },
          {
            name: 'lpSupply';
            docs: ['True circulating supply without burns and lock-ups'];
            type: 'u64';
          },
          {
            name: 'coinCreator';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'globalVolumeAccumulator';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'startTime';
            type: 'i64';
          },
          {
            name: 'endTime';
            type: 'i64';
          },
          {
            name: 'secondsInADay';
            type: 'i64';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'totalTokenSupply';
            type: {
              array: ['u64', 30];
            };
          },
          {
            name: 'solVolumes';
            type: {
              array: ['u64', 30];
            };
          }
        ];
      };
    },
    {
      name: 'userVolumeAccumulator';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'needsClaim';
            type: 'bool';
          },
          {
            name: 'totalUnclaimedTokens';
            type: 'u64';
          },
          {
            name: 'totalClaimedTokens';
            type: 'u64';
          },
          {
            name: 'currentSolVolume';
            type: 'u64';
          },
          {
            name: 'lastUpdateTimestamp';
            type: 'i64';
          },
          {
            name: 'hasTotalClaimedTokens';
            type: 'bool';
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'NotAuthorized';
      msg: 'The given account is not authorized to execute this instruction.';
    },
    {
      code: 6001;
      name: 'AlreadyInitialized';
      msg: 'The program is already initialized.';
    },
    {
      code: 6002;
      name: 'InvalidPoolConfig';
      msg: 'Invalid pool configuration.';
    },
    {
      code: 6003;
      name: 'InsufficientLiquidity';
      msg: 'Insufficient liquidity in the pool.';
    },
    {
      code: 6004;
      name: 'SlippageExceeded';
      msg: 'Slippage tolerance exceeded.';
    },
    {
      code: 6005;
      name: 'InvalidTokenMint';
      msg: 'Invalid token mint provided.';
    },
    {
      code: 6006;
      name: 'PoolDisabled';
      msg: 'Pool operations are currently disabled.';
    }
  ];
};