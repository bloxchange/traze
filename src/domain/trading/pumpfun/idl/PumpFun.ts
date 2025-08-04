export type PumpFun = {
  address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
  metadata: {
    name: 'pump';
    version: '0.1.0';
    spec: '0.1.0';
    description: 'Created with Anchor';
  };
  instructions: [
    {
      name: 'adminSetCreator';
      discriminator: [69, 25, 171, 142, 57, 239, 13, 4];
      docs: [
        'Allows Global::admin_set_creator_authority to override the bonding curve creator'
      ];
      accounts: [
        {
          name: 'adminSetCreatorAuthority';
          signer: true;
          relations: ['global'];
        },
        {
          name: 'global';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108];
              }
            ];
          };
        },
        {
          name: 'mint';
        },
        {
          name: 'bondingCurve';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
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
          name: 'creator';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'buy';
      discriminator: [102, 6, 61, 18, 1, 218, 235, 234];
      docs: ['Buys tokens from a bonding curve.'];
      accounts: [
        {
          name: 'global';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108];
              }
            ];
          };
        },
        {
          name: 'feeRecipient';
          writable: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'bondingCurve';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'associatedBondingCurve';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'account';
                path: 'bondingCurve';
              },
              {
                kind: 'const';
                value: [
                  6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169
                ];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
            program: {
              kind: 'const';
              value: [
                140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218, 255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89
              ];
            };
          };
        },
        {
          name: 'associatedUser';
          writable: true;
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'creatorVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 114, 101, 97, 116, 111, 114, 45, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'bondingCurve.creator';
                account: 'BondingCurve';
              }
            ];
          };
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
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'maxSolCost';
          type: 'u64';
        }
      ];
    },
    {
      name: 'create';
      discriminator: [24, 30, 200, 40, 5, 28, 7, 119];
      docs: ['Creates a new coin and bonding curve.'];
      accounts: [
        {
          name: 'mint';
          writable: true;
          signer: true;
        },
        {
          name: 'mintAuthority';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [109, 105, 110, 116, 45, 97, 117, 116, 104, 111, 114, 105, 116, 121];
              }
            ];
          };
        },
        {
          name: 'bondingCurve';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'associatedBondingCurve';
          writable: true;
        },
        {
          name: 'global';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108];
              }
            ];
          };
        },
        {
          name: 'mplTokenMetadata';
          address: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';
        },
        {
          name: 'metadata';
          writable: true;
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'associatedTokenProgram';
          address: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
        },
        {
          name: 'rent';
          address: 'SysvarRent111111111111111111111111111111111';
        },
        {
          name: 'eventAuthority';
          address: 'Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1';
        },
        {
          name: 'program';
          address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
        }
      ];
      args: [
        {
          name: 'name';
          type: 'string';
        },
        {
          name: 'symbol';
          type: 'string';
        },
        {
          name: 'uri';
          type: 'string';
        },
        {
          name: 'creator';
          type: 'pubkey';
        }
      ];
    },
    {
      name: 'sell';
      discriminator: [51, 230, 133, 164, 1, 127, 131, 173];
      docs: ['Sells tokens into a bonding curve.'];
      accounts: [
        {
          name: 'global';
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [103, 108, 111, 98, 97, 108];
              }
            ];
          };
        },
        {
          name: 'feeRecipient';
          writable: true;
        },
        {
          name: 'mint';
        },
        {
          name: 'bondingCurve';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [98, 111, 110, 100, 105, 110, 103, 45, 99, 117, 114, 118, 101];
              },
              {
                kind: 'account';
                path: 'mint';
              }
            ];
          };
        },
        {
          name: 'associatedBondingCurve';
          writable: true;
        },
        {
          name: 'associatedUser';
          writable: true;
        },
        {
          name: 'user';
          writable: true;
          signer: true;
        },
        {
          name: 'systemProgram';
          address: '11111111111111111111111111111111';
        },
        {
          name: 'creatorVault';
          writable: true;
          pda: {
            seeds: [
              {
                kind: 'const';
                value: [99, 114, 101, 97, 116, 111, 114, 45, 118, 97, 117, 108, 116];
              },
              {
                kind: 'account';
                path: 'bondingCurve.creator';
                account: 'BondingCurve';
              }
            ];
          };
        },
        {
          name: 'tokenProgram';
          address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        },
        {
          name: 'eventAuthority';
          address: 'Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1';
        },
        {
          name: 'program';
          address: '6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P';
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
          name: 'amount';
          type: 'u64';
        },
        {
          name: 'minSolOutput';
          type: 'u64';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'bondingCurve';
      discriminator: [23, 183, 248, 55, 96, 216, 172, 96];
    },
    {
      name: 'global';
      discriminator: [167, 232, 232, 177, 200, 108, 114, 127];
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
      name: 'adminSetCreatorEvent';
      discriminator: [69, 25, 171, 142, 57, 239, 13, 4];
    },
    {
      name: 'createEvent';
      discriminator: [27, 114, 169, 77, 222, 235, 99, 118];
    },
    {
      name: 'tradeEvent';
      discriminator: [189, 219, 127, 211, 78, 230, 97, 238];
    },
    {
      name: 'completeEvent';
      discriminator: [95, 114, 97, 156, 212, 46, 152, 8];
    },
    {
      name: 'setParamsEvent';
      discriminator: [223, 195, 159, 246, 62, 48, 143, 131];
    }
  ];
  types: [
    {
      name: 'adminSetCreatorEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'adminSetCreatorAuthority';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'bondingCurve';
            type: 'pubkey';
          },
          {
            name: 'oldCreator';
            type: 'pubkey';
          },
          {
            name: 'newCreator';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'bondingCurve';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'virtualTokenReserves';
            type: 'u64';
          },
          {
            name: 'virtualSolReserves';
            type: 'u64';
          },
          {
            name: 'realTokenReserves';
            type: 'u64';
          },
          {
            name: 'realSolReserves';
            type: 'u64';
          },
          {
            name: 'tokenTotalSupply';
            type: 'u64';
          },
          {
            name: 'complete';
            type: 'bool';
          },
          {
            name: 'creator';
            type: 'pubkey';
          }
        ];
      };
    },
    {
      name: 'createEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'name';
            type: 'string';
          },
          {
            name: 'symbol';
            type: 'string';
          },
          {
            name: 'uri';
            type: 'string';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'bondingCurve';
            type: 'pubkey';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'creator';
            type: 'pubkey';
          },
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'virtualTokenReserves';
            type: 'u64';
          },
          {
            name: 'virtualSolReserves';
            type: 'u64';
          },
          {
            name: 'realTokenReserves';
            type: 'u64';
          },
          {
            name: 'tokenTotalSupply';
            type: 'u64';
          }
        ];
      };
    },
    {
      name: 'global';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'initialized';
            docs: ['Unused'];
            type: 'bool';
          },
          {
            name: 'authority';
            type: 'pubkey';
          },
          {
            name: 'feeRecipient';
            type: 'pubkey';
          },
          {
            name: 'initialVirtualTokenReserves';
            type: 'u64';
          },
          {
            name: 'initialVirtualSolReserves';
            type: 'u64';
          },
          {
            name: 'initialRealTokenReserves';
            type: 'u64';
          },
          {
            name: 'tokenTotalSupply';
            type: 'u64';
          },
          {
            name: 'feeBasisPoints';
            type: 'u64';
          },
          {
            name: 'withdrawAuthority';
            type: 'pubkey';
          },
          {
            name: 'enableMigrate';
            docs: ['Unused'];
            type: 'bool';
          },
          {
            name: 'poolMigrationFee';
            type: 'u64';
          },
          {
            name: 'creatorFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'feeRecipients';
            type: {
              array: ['pubkey', 7];
            };
          },
          {
            name: 'setCreatorAuthority';
            type: 'pubkey';
          },
          {
            name: 'adminSetCreatorAuthority';
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
      name: 'tradeEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'solAmount';
            type: 'u64';
          },
          {
            name: 'tokenAmount';
            type: 'u64';
          },
          {
            name: 'isBuy';
            type: 'bool';
          },
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'virtualSolReserves';
            type: 'u64';
          },
          {
            name: 'virtualTokenReserves';
            type: 'u64';
          },
          {
            name: 'realSolReserves';
            type: 'u64';
          },
          {
            name: 'realTokenReserves';
            type: 'u64';
          },
          {
            name: 'feeRecipient';
            type: 'pubkey';
          },
          {
            name: 'feeBasisPoints';
            type: 'u64';
          },
          {
            name: 'fee';
            type: 'u64';
          },
          {
            name: 'creator';
            type: 'pubkey';
          },
          {
            name: 'creatorFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'creatorFee';
            type: 'u64';
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
    },
    {
      name: 'completeEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'user';
            type: 'pubkey';
          },
          {
            name: 'mint';
            type: 'pubkey';
          },
          {
            name: 'bondingCurve';
            type: 'pubkey';
          },
          {
            name: 'timestamp';
            type: 'i64';
          }
        ];
      };
    },
    {
      name: 'setParamsEvent';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'initialVirtualTokenReserves';
            type: 'u64';
          },
          {
            name: 'initialVirtualSolReserves';
            type: 'u64';
          },
          {
            name: 'initialRealTokenReserves';
            type: 'u64';
          },
          {
            name: 'finalRealSolReserves';
            type: 'u64';
          },
          {
            name: 'tokenTotalSupply';
            type: 'u64';
          },
          {
            name: 'feeBasisPoints';
            type: 'u64';
          },
          {
            name: 'withdrawAuthority';
            type: 'pubkey';
          },
          {
            name: 'enableMigrate';
            type: 'bool';
          },
          {
            name: 'poolMigrationFee';
            type: 'u64';
          },
          {
            name: 'creatorFeeBasisPoints';
            type: 'u64';
          },
          {
            name: 'feeRecipients';
            type: {
              array: ['pubkey', 8];
            };
          },
          {
            name: 'timestamp';
            type: 'i64';
          },
          {
            name: 'setCreatorAuthority';
            type: 'pubkey';
          },
          {
            name: 'adminSetCreatorAuthority';
            type: 'pubkey';
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
      name: 'TooMuchSolRequired';
      msg: 'slippage: Too much SOL required to buy the given amount of tokens.';
    },
    {
      code: 6003;
      name: 'TooLittleSolReceived';
      msg: 'slippage: Too little SOL received to sell the given amount of tokens.';
    },
    {
      code: 6004;
      name: 'MintDoesNotMatchBondingCurve';
      msg: 'The mint does not match the bonding curve.';
    },
    {
      code: 6005;
      name: 'BondingCurveComplete';
      msg: 'The bonding curve has completed and liquidity migrated to raydium.';
    },
    {
      code: 6006;
      name: 'BondingCurveNotComplete';
      msg: 'The bonding curve has not completed.';
    },
    {
      code: 6007;
      name: 'NotInitialized';
      msg: 'The program is not initialized.';
    },
    {
      code: 6008;
      name: 'WithdrawTooFrequent';
      msg: 'Withdraw too frequent';
    }
  ];
};
