import React from 'react';

interface AccountCode {
  id: number;
  code: string;
  name: string;
  created_at: string;
}

interface AccountCodesDebugProps {
  accountCodes: AccountCode[];
  isLoading: boolean;
  error: string | null;
}

export const AccountCodesDebug: React.FC<AccountCodesDebugProps> = ({
  accountCodes,
  isLoading,
  error
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔍 Account Codes Debug</h3>
      <div className="space-y-1">
        <div>Status: {isLoading ? '🔄 Loading' : '✅ Loaded'}</div>
        <div>Count: {accountCodes.length}</div>
        <div>Error: {error || 'None'}</div>
        {accountCodes.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Data Preview:</div>
            {accountCodes.slice(0, 3).map((code) => (
              <div key={code.id} className="ml-2">
                {code.code} - {code.name}
              </div>
            ))}
            {accountCodes.length > 3 && (
              <div className="ml-2 text-gray-400">
                ... and {accountCodes.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


